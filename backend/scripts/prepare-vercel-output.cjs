const fs = require("node:fs");
const path = require("node:path");

const frontendOutput = path.resolve(__dirname, "../../frontend/dist");
const vercelOutput = path.resolve(__dirname, "../vercel-output");

if (!fs.existsSync(path.join(frontendOutput, "index.html"))) {
  throw new Error(`Frontend build output is missing: ${frontendOutput}`);
}

fs.cpSync(frontendOutput, vercelOutput, { recursive: true, force: true });
