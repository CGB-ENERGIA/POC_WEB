export interface PhotoStampMeta {
  observer: string;
  equipe: string;
  time: Date;
}

export function stampAuditPhoto(base64: string, meta: PhotoStampMeta): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Imagem inválida"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas indisponível"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      const fs = Math.max(18, Math.round(img.width * 0.038));
      const pad = Math.round(fs * 0.7);
      const lh = Math.round(fs * 1.45);

      const dateStr = meta.time.toLocaleDateString("pt-BR", {
        timeZone: "America/Fortaleza",
      });
      const timeStr = meta.time.toLocaleTimeString("pt-BR", {
        timeZone: "America/Fortaleza",
      });

      const lines = [
        `📅 ${dateStr}  🕐 ${timeStr}`,
        `👷 ${meta.observer}`,
        `🚧 Equipe: ${meta.equipe || "—"}`,
      ];

      const boxH = pad * 2 + lines.length * lh;
      const y0 = img.height - boxH;

      ctx.fillStyle = "rgba(0,0,0,0.62)";
      ctx.fillRect(0, y0, img.width, boxH);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.textBaseline = "top";
      lines.forEach((line, i) => {
        ctx.fillText(line, pad, y0 + pad + i * lh);
      });

      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.src = base64;
  });
}
