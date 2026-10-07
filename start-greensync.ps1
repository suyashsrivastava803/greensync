# GreenSync local demo launcher. Run from any directory with PowerShell.
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ScriptDir "backend"
$FrontendDir = Join-Path $ScriptDir "frontend"
$VenvDir = Join-Path $BackendDir "venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$LogDir = Join-Path $ScriptDir ".run-logs"
$BackendProcess = $null
$FrontendProcess = $null

function Assert-Command([string]$Name, [string]$InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name was not found. $InstallHint"
    }
}

function Wait-ForHttp([string]$Url, [System.Diagnostics.Process]$Process, [string]$Service) {
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        if ($Process.HasExited) {
            throw "$Service stopped during startup. See logs in $LogDir."
        }
        try {
            Invoke-WebRequest -Uri $Url -TimeoutSec 2 -UseBasicParsing | Out-Null
            return
        } catch {
            Start-Sleep -Milliseconds 750
        }
    }
    throw "$Service did not become ready at $Url. See logs in $LogDir."
}

try {
    Assert-Command "python" "Install Python 3.10 or newer and enable it on PATH."
    Assert-Command "node" "Install Node.js 20.9 or newer and enable it on PATH."
    Assert-Command "npm" "Install Node.js 20.9 or newer (npm is included)."

    $PythonVersion = python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
    $PythonVersionParts = $PythonVersion.Trim().Split('.')
    if ([int]$PythonVersionParts[0] -lt 3 -or ([int]$PythonVersionParts[0] -eq 3 -and [int]$PythonVersionParts[1] -lt 10)) {
        throw "GreenSync requires Python 3.10 or newer. Detected Python $PythonVersion."
    }

    $NodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
    $NodeParts = (node -p "process.versions.node").Trim().Split('.')
    if ($NodeMajor -lt 20 -or ($NodeMajor -eq 20 -and [int]$NodeParts[1] -lt 9)) {
        throw "GreenSync's Next.js version requires Node.js 20.9 or newer. Detected $(node --version)."
    }

    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

    if (-not (Test-Path $VenvPython)) {
        Write-Host "Creating backend virtual environment..." -ForegroundColor Cyan
        Push-Location $ScriptDir
        try { python -m venv $VenvDir } finally { Pop-Location }
    }
    if (-not (Test-Path $VenvPython)) { throw "Python virtual environment creation failed." }

    $BackendRequirements = Join-Path $BackendDir "requirements.txt"
    $BackendDependencyStamp = Join-Path $VenvDir ".requirements.sha256"
    $BackendRequirementsHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $BackendRequirements).Hash
    $InstallBackendDependencies = -not (Test-Path $BackendDependencyStamp)
    if (-not $InstallBackendDependencies) {
        $InstallBackendDependencies = (Get-Content -Raw -LiteralPath $BackendDependencyStamp).Trim() -ne $BackendRequirementsHash
    }
    if ($InstallBackendDependencies) {
        Write-Host "Installing backend dependencies (first run or requirements changed)..." -ForegroundColor Cyan
        & $VenvPython -m pip install -r $BackendRequirements
        if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }
        Set-Content -LiteralPath $BackendDependencyStamp -Value $BackendRequirementsHash -NoNewline
    }

    $FrontendModules = Join-Path $FrontendDir "node_modules"
    $FrontendLock = Join-Path $FrontendDir "package-lock.json"
    $FrontendDependencyStamp = Join-Path $LogDir "frontend-dependencies.sha256"
    $FrontendLockHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $FrontendLock).Hash
    $InstallFrontendDependencies = -not (Test-Path $FrontendModules) -or -not (Test-Path $FrontendDependencyStamp)
    if (-not $InstallFrontendDependencies) {
        $InstallFrontendDependencies = (Get-Content -Raw -LiteralPath $FrontendDependencyStamp).Trim() -ne $FrontendLockHash
    }
    if ($InstallFrontendDependencies) {
        Push-Location $FrontendDir
        try {
            if (Test-Path $FrontendModules) {
                Write-Host "Updating frontend dependencies from package-lock.json..." -ForegroundColor Cyan
                npm install --no-audit --no-fund
            } else {
                Write-Host "Installing frontend dependencies from package-lock.json..." -ForegroundColor Cyan
                npm ci --no-audit --no-fund
            }
        } finally { Pop-Location }
        if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }
        Set-Content -LiteralPath $FrontendDependencyStamp -Value $FrontendLockHash -NoNewline
    }

    Write-Host "Preparing demo telemetry database..." -ForegroundColor Cyan
    Push-Location $BackendDir
    try { & $VenvPython -m data.seed_scada_data } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw "Telemetry database initialization failed." }

    Write-Host "Building the production dashboard..." -ForegroundColor Cyan
    Push-Location $FrontendDir
    try { npm run build } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { throw "Frontend production build failed. See the output above." }

    Write-Host "Starting API and dashboard..." -ForegroundColor Green
    $BackendProcess = Start-Process -FilePath $VenvPython `
        -ArgumentList "run_backend.py" -WorkingDirectory $BackendDir -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogDir "backend.log") `
        -RedirectStandardError (Join-Path $LogDir "backend-error.log")
    $NodeExecutable = (Get-Command "node").Source
    $NextCli = Join-Path $FrontendDir "node_modules\next\dist\bin\next"
    $FrontendProcess = Start-Process -FilePath $NodeExecutable `
        -ArgumentList ('"{0}" start --hostname 127.0.0.1' -f $NextCli) -WorkingDirectory $FrontendDir -PassThru -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogDir "frontend.log") `
        -RedirectStandardError (Join-Path $LogDir "frontend-error.log")
    Set-Content -Path (Join-Path $LogDir "backend.pid") -Value $BackendProcess.Id
    Set-Content -Path (Join-Path $LogDir "frontend.pid") -Value $FrontendProcess.Id

    Wait-ForHttp "http://127.0.0.1:8000/healthz" $BackendProcess "Backend"
    Wait-ForHttp "http://127.0.0.1:3000/" $FrontendProcess "Dashboard"

    Write-Host "GreenSync is ready:" -ForegroundColor Green
    Write-Host "  Dashboard: http://localhost:3000"
    Write-Host "  API docs:  http://127.0.0.1:8000/docs"
    Write-Host "  Logs:      $LogDir"
    Start-Process "http://localhost:3000"
    Write-Host "Servers continue in the background. Run $(Join-Path $ScriptDir 'stop-greensync.ps1') when the demo is over." -ForegroundColor DarkGray
} catch {
    foreach ($process in @($FrontendProcess, $BackendProcess)) {
        if ($process -and -not $process.HasExited) {
            Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
        }
    }
    Remove-Item -LiteralPath (Join-Path $LogDir "backend.pid"), (Join-Path $LogDir "frontend.pid") -Force -ErrorAction SilentlyContinue
    Write-Error $_
    exit 1
}
