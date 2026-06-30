import { cpSync, mkdirSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");

function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

console.log("Building POC_OP (web)...");
run("npm run vercel-build", join(root, "POC_OP"));

console.log("Building POC_Mobile (PWA)...");
run("npm run vercel-build", join(root, "POC_Mobile"));

console.log("Merging outputs into dist/...");
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

cpSync(join(root, "POC_OP", "dist", "spa"), output, { recursive: true });
cpSync(join(root, "POC_Mobile", "dist", "pwa"), join(output, "mobile"), {
  recursive: true,
});

console.log("Done. Deploy dist/ with:");
console.log("  /        -> POC_OP (painel web)");
console.log("  /mobile/ -> POC_Mobile (checklist PWA)");
