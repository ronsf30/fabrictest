# Next Steps: Connect Your Sample to Microsoft Fabric as a Workload

This guide assumes your frontend and backend are already running locally in dev/debug mode (not store/production). It focuses on wiring that running setup into Fabric, validating auth, and iterating safely.

## 1) Prerequisites & Identity
- **Fabric access**: A Fabric workspace where you can add a custom workload, plus permission to consent the required scopes.
- **Entra ID app**: Created via `Authentication/CreateDevAADApp.ps1` (or equivalent). You need:
  - `PublisherTenantId`, `ClientId`, `ClientSecret`, `Audience`.
  - Redirect URI (e.g., `http://localhost:60006/close` for local frontend).
  - Granted scopes and pre-authorized apps from the script output (for Fabric control, item scopes, Lakehouse scopes).
- **Local endpoints**: Backend reachable (e.g., `http://localhost:5001`), frontend dev server (e.g., `http://127.0.0.1:60006`).
- **Network**: If behind a corporate proxy, allow localhost traffic and DevGateway callbacks.

Verification commands and expected signals:
```bash
az login
# Expect browser prompt; output includes your tenantId matching PublisherTenantId.

az ad app show --id <ClientId> --query "{appId:appId, replyUrls:spa.redirectUris, identifierUris:identifierUris}" -o json
# Expect appId = <ClientId>, identifierUris containing your Audience, redirectUris containing http://localhost:60006/close.
```

## 2) Frontend environment (already set; verify only if needed)
If your `.env.dev` is already populated from getstarted, you can skip reconfig. To double-check values:
```
WORKLOAD_NAME=Org.YourWorkload            # must match workload name pattern expected by Fabric
WORKLOAD_BE_URL=http://localhost:5001     # must match backend port/host
DEV_AAD_CONFIG_AUDIENCE=api://...         # from AAD app (identifier URI)
DEV_AAD_CONFIG_APPID=<ClientId>           # your app registration clientId
DEV_AAD_CONFIG_REDIRECT_URI=http://localhost:60006/close
```

Verify (non-startup; assumes dev server is already running):
```bash
curl http://127.0.0.1:60006/manifests_new/metadata
# Expect JSON like:
# {"extension":{"name":"Org.YourWorkload","url":"http://127.0.0.1:60006", "devAADAppConfig":{...}}}
```

## 3) Build the frontend manifest package
What happens:
- `validation/generate-nuspec.js` and `validation/build-nuget.js` generate a NuGet package with your manifest and static assets.
- It is served by the dev server for Fabric overrides.

If your dev server is already running, the package is already generated and served. If you need to regenerate without restarting dev:
- Stop dev server, run `npm run build:test` (or `npm run build:prod`), then restart dev server; or
- Leave dev server running and re-run `npm run build:test` in another shell to refresh the `.nupkg`.

Manual build (no dev server):
```bash
cd Frontend
npm run build:test    # or npm run build:prod
# Expect "Successfully created package '.../ManifestPackageRelease.1.0.0.nupkg'" from nuget
```

## 4) Backend auth values (assumed set; verify only)
If `.env` and `appsettings.json` are already set from getstarted, do not reconfigure. Quick verification (Python backend running):
```bash
curl -i http://localhost:5001/health        # expect 200 OK
curl -i http://localhost:5001/api/calculateText \
  -H "Authorization: Bearer <access_token>" # expect 200 if token valid; 401 if missing/invalid
```
If you ever change ports, update both `PORT` in `.env` and `Server:Port` in `appsettings.json`, plus `WORKLOAD_BE_URL` in the frontend env files. For .NET, use `Server__Port` env var to override.

## 5) Build backend manifest/package
Python path:
- Runs directly; no NuGet packaging by default. If you need a package for DevGateway, wrap your backend assets into a NuGet (custom, optional).
- If `Backend/python/src/Packages/manifest` exists, validate it with `tools/validation/Invoke-ManifestValidation.ps1`.

.NET path (only if you choose .NET backend):
```bash
cd Backend/dotnet/src
dotnet build /p:Configuration=Release   # validation runs unless RunValidation=false
# Expect ManifestPackageRelease.nupkg under Packages/manifest
```

## 6) Run DevGateway to proxy to Fabric (optional but recommended in dev)
Purpose: Expose your local workload to Fabric without public hosting.

Steps:
```bash
cd tools/DevGatewayContainer
cp sample.env .env
# Edit .env:
ENTRA_TENANT_ID=<tenant>
WORKSPACE_GUID=<workspace-id>
MANIFEST_PACKAGE_FILE_PATH=/absolute/path/to/ManifestPackageRelease.1.0.0.nupkg
LOCAL_BACKEND_PORT=5001
LOG_LEVEL=Information

docker compose up --build
```
Expected:
- Prompts to authenticate to Fabric (use the account with workspace access).
- Logs show it listening and proxying to `LOCAL_BACKEND_PORT`.
- On Apple Silicon, enable Rosetta for x86/amd64 images if runtime errors occur.

## 7) Override the manifest in Fabric (dev loop, not store release)
Goal: Make Fabric load your local manifest/package instead of the default.

Endpoints served by the dev server:
- Metadata: `http://127.0.0.1:60006/manifests_new/metadata` (JSON descriptor)
- Package: `http://127.0.0.1:60006/manifests_new` (NuGet package download)

Actions:
1. Ensure your frontend dev server is running (endpoints above are live).
2. In Fabric dev settings or via DevGateway, point the workload manifest URL to the package endpoint above.
3. Open the workload in Fabric; it should load the local UI and call your backend (dev/debug only).

Expected signals:
- DevGateway/container logs show Fabric requesting the manifest/package.
- Frontend dev server logs requests to `/manifests_new`.
- Browser loads your local UI in the Fabric shell.

## 8) Validate auth flow (dev/debug)
1. Log into Fabric with an account in your tenant.
2. Start the workload (manifest override active).
3. Frontend acquires tokens using `DEV_AAD_CONFIG_APPID`/`DEV_AAD_CONFIG_AUDIENCE`.
4. Backend validates bearer tokens against `PublisherTenantId` + `Audience`.

Checklist and expected behavior:
- Backend logs: no “Missing ClientId/ClientSecret”; should log successful token validation or authorized requests.
- `GET /health` returns 200 (no auth). A secured endpoint (e.g., `/api/calculateText`) returns 401 if token missing, 200 with valid bearer token.
- Frontend network calls (browser dev tools) show Authorization headers and 200 responses.

## 9) Common issues and fixes
- **Port conflicts**: Change `Server:Port` (backend) and `WORKLOAD_BE_URL` (frontend) together; restart both.
- **MSAL not initialized**: Set `CLIENT_ID` and `CLIENT_SECRET` in backend env/config; restart backend.
- **NuGet missing**: Install .NET SDK or Mono; `cd Frontend && npx nuget help | head -n 1` should show a version.
- **DevGateway on Apple Silicon**: Enable Rosetta for x86/amd64 images in Docker Desktop.
- **CORS/hosts**: Development defaults are permissive; for production, set `AllowedHosts` and `CorsOrigins` to explicit values.

## 10) Move toward certification/production
- Fill manifest metadata: item definitions, icons, permissions, endpoints, certification requirements.
- Validate manifests:  
  `tools/validation/Invoke-ManifestValidation.ps1 -PackageDirectory "<manifestDir>" -AppSettingsPath "<appsettings>" -Verbose`
- HTTPS: terminate TLS (nginx/reverse proxy) or configure certs for the backend; update URLs accordingly.
- Telemetry/monitoring: wire health/readiness to your hosting platform; add logging/metrics sinks.
- Secrets: move to managed secret stores (Key Vault, environment injection) instead of `.env`/checked-in files.
- CI/CD: script `npm run build:prod` + backend build/pack + validation in your pipeline.

## 11) Quick end-to-end smoke (dev/debug)
1. Backend already up: `curl http://localhost:5001/health` → expect 200/OK JSON.
2. Frontend dev server already up: `curl -I http://127.0.0.1:60006` → 200; manifest endpoints return 200.
3. DevGateway up (if used) and authenticated (logs show successful login).
4. Launch workload in Fabric with manifest override → UI loads, API calls succeed, no 401/403.

With these steps, your local frontend/backend are ready to act as a Fabric workload in a development loop. Use manifest overrides and DevGateway to iterate quickly, then move to packaged manifests and production-ready hosting for certification. 
