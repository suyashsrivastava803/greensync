"""
GreenSync Microgrid EMS Server Runner
"""

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.PROJECT_NAME} on http://127.0.0.1:8000 ...")
    # This launcher is for a local demo. Keep the API private to this machine and
    # avoid the reloader spawning duplicate simulator state in child processes.
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
