const fs = require("node:fs");
const path = require("node:path");

fs.mkdirSync(path.resolve(__dirname, "..", "vercel-output"), { recursive: true });
