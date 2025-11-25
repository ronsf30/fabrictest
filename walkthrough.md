# Local Fabric Workload Execution (Python)

This document details the steps taken to set up and run the Fabric Workload example with a Python Backend.

## Current Status

| Component | Status | Port | Notes |
| :--- | :--- | :--- | :--- |
| **Backend (Python)** | ✅ **Running** | `5001` | Responds correctly at `/health`. |
| **Frontend** | ✅ **Running** | `60006` | Accessible at `http://localhost:60006`. |
| **DevGateway** | ⚠️ **Partial** | - | Starts and authenticates, but reports validation error in `WorkloadManifest.xml`. |

## Steps Performed

1.  **Environment Setup**:
    *   Installed **Python 3.12** and **Rust** (required for dependencies).
    *   Created virtual environment `.venv` and installed dependencies (`requirements.txt`).
    *   Configured `.env` for Backend and Frontend.

2.  **Frontend**:
    *   Created missing `webpack.config.js` to allow building.
    *   Fixed build script in `package.json`.
    *   Generated NuGet package (`ManifestPackageRelease.1.0.0.nupkg`) including `WorkloadManifest.xml`.

3.  **DevGateway**:
    *   Configured `compose.yaml` and `.env` with Workspace ID.
    *   Started Docker container.
    *   **Authentication**: User completed login with device code.

## Known Issue: Manifest Validation

The DevGateway reports the following error when attempting to register the instance:
`Cannot deserialize XML: There is an error in XML document (2, 2).`

This indicates a problem with the format of `WorkloadManifest.xml`. Several fixes have been attempted (schema version, namespace, encoding), but the error persists.

**Recommended Action**:
*   Verify the exact `WorkloadManifest.xml` format required by the current DevGateway version.
*   Try loading the Workload in Fabric using the manifest URL (Frontend) to see if Fabric provides a more detailed error.

## How to Continue

1.  **Keep services running**:
    *   Backend: `python src/main.py`
    *   Frontend: `npm start`
    *   DevGateway: `docker compose up`

2.  **Fabric Configuration**:
    *   Go to **Fabric** -> **Developer View**.
    *   Add new Workload.
    *   **Manifest URL**: `http://localhost:60006/manifests_new/metadata` (or the URL indicated by the Frontend).
    *   If Fabric accepts the manifest, the DevGateway error might be secondary or specific to the local version.

## Step-by-Step Guide: Fabric Configuration

To see your Workload in Fabric, you must first enable developer permissions.

### Step 1: Enable Developer Mode (Admin Portal)
1.  Log in to **[app.fabric.microsoft.com](https://app.fabric.microsoft.com)**.
2.  In the top right corner, click the **Gear icon (⚙️)**.
3.  Select **Admin portal**.
4.  In the left sidebar, click **Tenant settings**.
5.  In the search bar above, type: **"Workload"**.
6.  Look for the option: **"Capacity admins can develop additional workloads"**.
    *   **Enable it**.
    *   Ensure your user or security group is included.
    *   Click **Apply**.
    *   *Note: It may take up to 15 minutes to apply.*

### Step 2: Prepare the Workspace
1.  Go to **Workspaces** in the left menu.
2.  Create a **New workspace** (or use an existing one).
3.  **Important**: Assign a **Capacity License** (Fabric Capacity or Trial).
    *   Go to **Workspace settings** -> **License info**.
    *   Select **Trial** or an F64/P1 capacity.
    *   *Workloads do NOT work on standard "Pro" or "PPU" without Fabric capacity.*

### Step 3: Verify the Workload (The Role of DevGateway)
This is where the **DevGateway** is crucial.
*   **If DevGateway works**: You will automatically see a new item type called "Org.WorkloadSample" (or similar) appear in the "New" menu of your Workspace.
*   **If DevGateway fails (Current Case)**: The item will **NOT appear** in the menu.

**Why doesn't my Workload appear?**
The `Cannot deserialize XML` error in your DevGateway is preventing Fabric from knowing your Workload exists. Until we fix that XML, you won't see the option in the "New" menu.

> [!WARNING]
> **Current Blocker**: There is no field to "Enter Manual URL" if the Workload item hasn't been created first. The DevGateway is the only mechanism to create this initial item in your development environment.

### Recommended Next Step
Since the DevGateway continues to reject the XML (even after format and encoding fixes), I suggest:
1.  **Check DevGateway version**: Ensure you are using the latest image or one compatible with your manifest.
2.  **Contact Support / Repository**: The `(1, 2)` or `(2, 2)` error is very specific to the Gateway's internal validation.
