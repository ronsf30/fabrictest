const fs = require("fs").promises;
const { exec } = require("child_process");
const util = require("util");
const path = require("path");

const execAsync = util.promisify(exec);

const outputDir = path.resolve(__dirname, ""); // Ensure the path is resolved correctly
const packageName = "ManifestPackageRelease";

async function buildNugetPackage() {
  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    const nuspecPath = path.join(outputDir, `${packageName}.nuspec`);

    // Use local NuGet CLI with mono
    const nugetExePath = path.join(path.resolve(__dirname, "../node_modules/nuget-bin/nuget.exe"));
    const { stdout, stderr } = await execAsync(`mono "${nugetExePath}" pack "${nuspecPath}" -OutputDirectory "${outputDir}" -Verbosity detailed`);

    if (stderr) console.error(`⚠️ NuGet stderr: ${stderr}`);
    console.log(`📦 NuGet output: ${stdout}`);
  }
  catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

buildNugetPackage();