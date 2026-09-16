/**
 * Gera ícones PWA e favicon a partir da logo oficial CGB.
 *
 * O logo fonte (public/assets/logo-cgb.png) é um losango que ocupa 100% do
 * canvas (sem margem transparente). Copiar esse arquivo direto como ícone
 * quadrado faz o Android cortar as pontas do losango nas máscaras adaptativas
 * (círculo, "squircle", quadrado arredondado). Por isso aqui redimensionamos
 * de verdade: fundo branco quadrado + logo centralizado ocupando ~65% do
 * canvas, o que mantém a arte inteira dentro da "safe zone" (círculo de
 * raio 40% do tamanho do ícone) exigida pelo spec de maskable icons.
 *
 * Executar: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const logo = join(__dirname, "..", "public", "assets", "logo-cgb.png");
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = "#ffffff";
const CONTENT_RATIO = 0.65; // logo ocupa 65% do canvas; resto é margem de segurança

const sizes = [
  // favicons
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-96x96.png", size: 96 },
  { name: "favicon-128x128.png", size: 128 },
  // PWA manifest (src-pwa/manifest.json)
  { name: "icon-128x128.png", size: 128 },
  { name: "icon-192x192.png", size: 192 },
  { name: "icon-256x256.png", size: 256 },
  { name: "icon-384x384.png", size: 384 },
  { name: "icon-512x512.png", size: 512 },
  // manifest gerado via quasar.config.ts (extendPWAManifestJson), inclui maskable
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  // Apple touch icons
  { name: "apple-icon-120x120.png", size: 120 },
  { name: "apple-icon-152x152.png", size: 152 },
  { name: "apple-icon-167x167.png", size: 167 },
  { name: "apple-icon-180x180.png", size: 180 },
  // Windows tile
  { name: "ms-icon-144x144.png", size: 144 },
];

for (const { name, size } of sizes) {
  const contentSize = Math.round(size * CONTENT_RATIO);
  const logoBuffer = await sharp(logo)
    .resize(contentSize, contentSize, { fit: "inside" })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(join(outDir, name));

  console.log(`Created ${name} (${size}x${size})`);
}
