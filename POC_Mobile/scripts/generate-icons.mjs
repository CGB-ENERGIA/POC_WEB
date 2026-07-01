/**
 * Gera ícones PWA e favicon a partir da logo oficial CGB.
 * Executar: node scripts/generate-icons.mjs
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logo = join(__dirname, "..", "public", "assets", "logo-cgb.png");
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const files = [
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon-96x96.png",
  "favicon-128x128.png",
  "icon-192.png",
  "icon-512.png",
];

for (const name of files) {
  copyFileSync(logo, join(outDir, name));
  console.log(`Created ${name}`);
}
