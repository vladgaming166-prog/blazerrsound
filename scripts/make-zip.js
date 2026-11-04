const { execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "SoundBlazerr-Source.zip");
const staging = fs.mkdtempSync(path.join(os.tmpdir(), "soundblazerr-"));
const dest = path.join(staging, "SoundBlazerr");

const excludes = new Set(["node_modules", "out", "dist", ".git", "SoundBlazerr-Source.zip"]);

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    if (excludes.has(name)) continue;
    const src = path.join(from, name);
    const target = path.join(to, name);
    const st = fs.statSync(src);
    if (st.isDirectory()) copyTree(src, target);
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(src, target);
    }
  }
}

copyTree(root, dest);
if (fs.existsSync(out)) fs.rmSync(out);
execSync(`zip -q -r "${out}" SoundBlazerr`, { cwd: staging, stdio: "inherit" });
fs.rmSync(staging, { recursive: true, force: true });
console.log("Wrote", out);
