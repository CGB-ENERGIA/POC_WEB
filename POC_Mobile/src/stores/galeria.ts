import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  dbSalvarFoto,
  dbListarFotos,
  dbExcluirFoto,
  dbLimparExpirados,
  type FotoEntry,
} from "@/utils/galeria-db";
import {
  cloudUploadFoto,
  cloudExcluirFoto,
  cloudLimparExpirados,
  cloudListarFotos,
} from "@/services/galeria-cloud";

export type { FotoEntry };

export const useGaleriaStore = defineStore("galeria", () => {
  const fotos        = ref<FotoEntry[]>([]);
  const carregando   = ref(false);
  const sincronizando = ref(false);
  let   iniciado     = false;

  // ── Carregamento principal ──────────────────────────────
  async function carregar() {
    if (iniciado) return;
    iniciado = true;
    carregando.value = true;
    try {
      await dbLimparExpirados(); // limpa entradas locais > 3 meses
      const todas = await dbListarFotos();
      fotos.value = todas.sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    } finally {
      carregando.value = false;
    }
  }

  // ── Adicionar + upload nuvem em background ──────────────
  async function adicionarFoto(blob: Blob, matricula: string): Promise<FotoEntry> {
    const entry: FotoEntry = {
      id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      matricula,
      dataHora:  new Date().toISOString(),
      blob,
      tamanho:   blob.size,
      cloudUrl:  null,
    };

    await dbSalvarFoto(entry);
    fotos.value.unshift(entry);

    // Upload para Supabase Storage em background (não bloqueia o UI)
    cloudUploadFoto(entry.id, matricula, blob)
      .then((url) => {
        entry.cloudUrl = url;
        // Atualizar entry no IndexedDB com a URL
        dbSalvarFoto({ ...entry, cloudUrl: url }).catch(() => {/* silencioso */});
      })
      .catch(() => {/* offline: tentará de novo quando reconectar */});

    return entry;
  }

  // ── Excluir local + nuvem ───────────────────────────────
  async function excluirFoto(id: string) {
    const foto = fotos.value.find(f => f.id === id);
    await dbExcluirFoto(id);
    const idx = fotos.value.findIndex(f => f.id === id);
    if (idx !== -1) fotos.value.splice(idx, 1);

    if (foto) {
      cloudExcluirFoto(id, foto.matricula).catch(() => {/* silencioso */});
    }
  }

  // ── Sincronizar com nuvem (carregar fotos do servidor) ──
  async function sincronizarNuvem(matricula: string) {
    if (sincronizando.value) return;
    sincronizando.value = true;
    try {
      await cloudLimparExpirados(matricula);

      // Busca todas as fotos da matrícula no Supabase Storage
      const cloudFotos = await cloudListarFotos(matricula);

      // Mescla: adiciona em memória as fotos cloud que não existem localmente
      const localIds = new Set(fotos.value.map(f => f.id));
      for (const cf of cloudFotos) {
        if (!localIds.has(cf.id)) {
          const entry: FotoEntry = {
            id:        cf.id,
            matricula: cf.matricula,
            dataHora:  cf.dataHora,
            tamanho:   cf.tamanho,
            cloudUrl:  cf.url,
          };
          fotos.value.push(entry);
        }
      }

      // Re-ordena por data decrescente
      fotos.value.sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    } catch {
      // Offline — ok, usa cache local
    } finally {
      sincronizando.value = false;
    }
  }

  function forcarRecarregar() {
    iniciado = false;
    fotos.value = [];
    return carregar();
  }

  // ── Computeds ───────────────────────────────────────────
  const porData = computed(() => {
    const mapa = new Map<string, FotoEntry[]>();
    for (const f of fotos.value) {
      const data = f.dataHora.slice(0, 10);
      if (!mapa.has(data)) mapa.set(data, []);
      mapa.get(data)!.push(f);
    }
    return Array.from(mapa.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  });

  const total             = computed(() => fotos.value.length);
  const tamanhoTotalBytes = computed(() => fotos.value.reduce((s, f) => s + f.tamanho, 0));

  return {
    fotos, carregando, sincronizando,
    carregar, adicionarFoto, excluirFoto, sincronizarNuvem, forcarRecarregar,
    porData, total, tamanhoTotalBytes,
  };
});
