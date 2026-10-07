const fs = require("node:fs");
const path = require("node:path");

const outputDirectory = path.resolve(__dirname, "..", "vercel-output");
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(
  path.join(outputDirectory, "index.html"),
  "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><title>Learning Platform API</title><body><main><h1>Learning Platform API</h1><p>API health: <a href=\"/api/health\">/api/health</a></p></main></body></html>\n",
  "utf8",
);
