const { spawnSync } = require("node:child_process");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  quiet: true,
});

const [tool, ...args] = process.argv.slice(2);
const cliPaths = {
  prisma: path.join(path.dirname(require.resolve("prisma/package.json")), "build", "index.js"),
  tsx: path.join(path.dirname(require.resolve("tsx/package.json")), "dist", "cli.mjs"),
};
const cliPath = cliPaths[tool];

if (!cliPath) {
  throw new Error(`Unsupported backend CLI: ${tool ?? "none"}`);
}

const result = spawnSync(process.execPath, [cliPath, ...args], {
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
