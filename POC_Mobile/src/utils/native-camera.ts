/**
 * Câmera nativa do celular via <input type="file" capture>.
 *
 * O app do próprio aparelho cuida de zoom, foco, flash, troca de câmera, rotação e
 * selfie — funciona igual em qualquer Android/iPhone. Aqui só lemos o arquivo,
 * aplicamos a orientação gravada pelo aparelho (EXIF) e reduzimos o tamanho.
 */

const MAX_LADO = 1600;
const QUALIDADE = 0.8;

/** Cria (uma vez por chamada) um input de câmera e o abre. Precisa vir de um toque do usuário. */
export function abrirCameraNativa(
  input: HTMLInputElement | null | undefined,
): void {
  if (!input) return;
  input.value = ""; // permite escolher/tirar de novo
  input.click();
}

async function carregar(file: File): Promise<{ src: CanvasImageSource; w: number; h: number; fechar: () => void }> {
  // createImageBitmap com "from-image" aplica a rotação EXIF da câmera.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { src: bmp, w: bmp.width, h: bmp.height, fechar: () => bmp.close() };
    } catch {
      /* cai para <img> */
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  // Navegadores atuais aplicam o EXIF ao <img> (image-orientation: from-image).
  return { src: img, w: img.naturalWidth, h: img.naturalHeight, fechar: () => URL.revokeObjectURL(url) };
}

/** Lê a foto da câmera nativa já em pé e reduzida, como data URL JPEG. */
export async function fotoNativaParaBase64(file: File): Promise<string> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|heic|heif|webp)$/i.test(file.name)) {
    throw new Error("O arquivo não é uma imagem.");
  }
  const { src, w, h, fechar } = await carregar(file);
  try {
    const escala = Math.min(1, MAX_LADO / Math.max(w, h));
    const cw = Math.round(w * escala);
    const ch = Math.round(h * escala);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(src, 0, 0, cw, ch);
    return canvas.toDataURL("image/jpeg", QUALIDADE);
  } finally {
    fechar();
  }
}
