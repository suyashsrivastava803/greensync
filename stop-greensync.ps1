$ErrorActionPreference = "Stop"
$LogDir = Join-Path $PSScriptRoot ".run-logs"

foreach ($service in @(
    @{ Name = "backend"; ExpectedProcess = "python" },
    @{ Name = "frontend"; ExpectedProcess = "node" }
)) {
    $pidFile = Join-Path $LogDir "$($service.Name).pid"
    if (-not (Test-Path $pidFile)) { continue }

    $serviceProcessId = 0
    if (-not [int]::TryParse((Get-Content $pidFile -Raw).Trim(), [ref]$serviceProcessId)) {
        Write-Warning "Ignoring invalid PID file: $pidFile"
        continue
    }

    $process = Get-Process -Id $serviceProcessId -ErrorAction SilentlyContinue
    if ($process -and $process.ProcessName -eq $service.ExpectedProcess) {
        Stop-Process -Id $serviceProcessId
        Write-Host "Stopped GreenSync $($service.Name) (PID $serviceProcessId)."
    } elseif ($process) {
        Write-Warning "PID $serviceProcessId now belongs to '$($process.ProcessName)'; leaving it alone."
    }

    Remove-Item -LiteralPath $pidFile -Force
}
