# Get Started (Frontend & Backend)

A step-by-step guide to get the sample frontend and both backend implementations running locally on Windows and macOS.

## 1) Prerequisites
- Git and a modern terminal (Windows: Windows Terminal + PowerShell; macOS: Terminal/iTerm + pwsh if needed).
- Azure CLI (required for AAD setup scripts and DevGateway auth).
- Docker Desktop (for optional DevGateway and Python Docker run); enable Rosetta for x86/amd64 images on Apple Silicon.
- Admin rights to install tooling.

### Platform tooling
| Purpose | Windows install | macOS install |
| --- | --- | --- |
| Node 18+ | `winget install OpenJS.NodeJS.LTS` | `brew install node` |
| .NET 8 SDK | `winget install Microsoft.DotNet.SDK.8` | `brew install dotnet-sdk` |
| PowerShell Core (pwsh) | `winget install Microsoft.PowerShell` | `brew install --cask powershell` |
| Python 3.11+ | `winget install Python.Python.3.11` | `brew install python@3.11` |
| Mono (only if NuGet via mono is preferred) | `winget install Mono.MDK` | `brew install mono` |
| Docker Desktop | https://www.docker.com/products/docker-desktop | https://www.docker.com/products/docker-desktop |
| Azure CLI | `winget install Microsoft.AzureCLI` | `brew install azure-cli` |

Notes:
- The .NET backend build runs a PowerShell validation step; pwsh is required on non-Windows.
- Frontend build uses the NuGet CLI via `nuget-bin`; either Mono or the .NET SDK satisfies that requirement on macOS.

### Verify installed versions (and handle mismatches)
Run these and compare to the “Goal” column to see if you must install or pin anything. Tools can coexist side-by-side; only install the missing versions, don’t remove newer ones.

| Command | Goal | If different |
| --- | --- | --- |
| `node -v` | v18–v20 LTS | If lower/higher, install LTS (18 or 20). Multiple Node versions can coexist via nvm/Volta; otherwise install latest LTS. |
| `npm -v` | 10.x | Comes with Node LTS; if mismatched, reinstall Node LTS. |
| `dotnet --info` | SDK list contains 8.0.x (net8) | If only 10.x is present, add SDK 8 side-by-side. macOS: `brew install dotnet-sdk@8` or use Microsoft installer; Windows: `winget install Microsoft.DotNet.SDK.8`. To force SDK 8 usage here, create a `global.json` with `{ "sdk": { "version": "8.0.x" } }` in the repo root. |
| `pwsh -v` | 7.x | Install pwsh if missing (needed for .NET manifest validation). |
| `python3.11 --version` (or `py -3.11 --version`) | 3.11.x | If you have another Python, install 3.11 side-by-side and use the explicit `python3.11`/`py -3.11` commands. |
| `az version` | azure-cli 2.x | Upgrade if very old; any recent 2.x works. |
| `docker --version` | 26–28.x | Newer is usually fine; ensure Docker Desktop is healthy. |
| `docker compose version` | 2.x | Install/upgrade Docker Desktop if missing. |
| `cd Frontend && npx nuget help | head -n 1` | NuGet Version 6.x | If missing, ensure .NET SDK or Mono is installed so `nuget-bin` shim works. |
| `mono --version` (optional) | Mono JIT 6.x | Only needed if you prefer Mono for NuGet. |
| `git --version` | 2.x | Upgrade if very old. |

## 2) Fabric/AAD setup
You need an Entra ID app and Fabric workspace details. Use `Authentication/CreateDevAADApp.ps1` (works on Windows or macOS via pwsh) to create a dev app:
1. `pwsh ./Authentication/CreateDevAADApp.ps1 -applicationName "<name>" -workloadName "Org.<YourWorkload>" -tenantId "<tenantGuid>"`
2. Capture the output values:
   - `PublisherTenantId`
   - `ClientId`
   - `ClientSecret`
   - `Audience` (api://localdevinstance/<tenant>/<workload>/<random>)

You will reuse these in both backend configs and the frontend env files.

## 3) Backend options
You can run either the Python FastAPI backend or the .NET 8 backend. Only one is needed for the sample.

### Option A: Python FastAPI backend
Location: `Backend/python`
1. Create and activate a virtual environment  
   - Windows: `py -3.11 -m venv venv && venv\Scripts\activate`  
   - macOS: `python3.11 -m venv venv && source venv/bin/activate`
2. Install dependencies  
   `pip install -r requirements.txt`  
   (If you hit an encoding issue, convert the UTF-16 file to UTF-8 and retry.)
3. Configure environment (create `.env` in `Backend/python/`):
   ```
   PYTHON_ENVIRONMENT=Development
   DEBUG=false
   PUBLISHER_TENANT_ID=<tenant>
   CLIENT_ID=<clientId>
   CLIENT_SECRET=<secret>
   AUDIENCE=<audience>
   HOST=0.0.0.0
   PORT=5001
   WORKERS=1
   ```
4. Run in development  
   - Windows/macOS: `cd Backend/python/src && python main.py`  
   Alternate (reload): `PYTHONPATH=src uvicorn fabric_api.main:app --host 0.0.0.0 --port 5001 --reload`
5. Health check: open http://localhost:5001/health
6. (Optional) Docker: `cd Backend/python && docker compose up --build`

### Option B: .NET 8 backend
Location: `Backend/dotnet/src`
1. Ensure .NET 8 SDK and pwsh are installed.
2. Set environment variables (or edit `appsettings.json`):  
   `PublisherTenantId`, `ClientId`, `ClientSecret`, `Audience`.  
   You can export them in your shell before running `dotnet run`.
3. Restore and run  
   ```
   cd Backend/dotnet/src
   dotnet restore
   dotnet run
   ```
   The pre-build manifest validation uses pwsh; if you need to skip it, run with `dotnet run /p:RunValidation=false`.
4. Service listens on http://127.0.0.1:5001 (HTTPS on 5002 if configured).

## 4) Frontend
Location: `Frontend`
1. Install dependencies  
   ```
   cd Frontend
   npm install
   ```
   (NuGet CLI comes from `node_modules/.bin/nuget`; ensure .NET SDK or Mono is present on macOS.)
2. Create env files (at least `.env.dev` for local dev):
   ```
   WORKLOAD_NAME=Org.YourWorkload
   WORKLOAD_BE_URL=http://localhost:5001
   DEV_AAD_CONFIG_AUDIENCE=<audience>
   DEV_AAD_CONFIG_APPID=<clientId>
   DEV_AAD_CONFIG_REDIRECT_URI=http://localhost:60006/close
   ```
3. Start dev server  
   `npm start`  
   This will generate the NuGet package and start webpack dev server on http://127.0.0.1:60006.
4. Test that the manifest endpoints respond:  
   - Metadata: http://127.0.0.1:60006/manifests_new/metadata  
   - Package: http://127.0.0.1:60006/manifests_new

## 5) Optional: DevGateway container
Location: `tools/DevGatewayContainer`
1. Copy and edit env:  
   `cd tools/DevGatewayContainer && cp sample.env .env`  
   Set `ENTRA_TENANT_ID`, `WORKSPACE_GUID`, `MANIFEST_PACKAGE_FILE_PATH` (path to your backend `.nupkg`), `LOCAL_BACKEND_PORT`, `LOG_LEVEL`.
2. Build and run: `docker compose up --build`
3. Follow terminal prompts to authenticate to Fabric. On Apple Silicon, ensure Rosetta is enabled in Docker Desktop for x86/amd64 images.

## 6) Quick verification
- Backend (Python): `curl http://localhost:5001/health`
- Backend (.NET): `curl http://127.0.0.1:5001/health`
- Frontend dev server: open http://127.0.0.1:60006 and verify bundle is served; check manifest endpoints above.

## 7) Troubleshooting
- pwsh missing error during .NET build → install PowerShell Core and ensure `pwsh` is on PATH.
- NuGet command missing during frontend build → install .NET SDK or Mono so `nuget-bin` shim can run.
- Port conflicts → change `PORT`/`WORKLOAD_BE_URL` consistently across backend env and frontend env files.
- Encoding error reading `Backend/python/requirements.txt` → convert to UTF-8 (`iconv -f utf-16 -t utf-8 -o requirements.txt requirements.txt` backup first).

You’re ready to run: start a backend (Python or .NET), start the frontend, and test via the URLs above.
