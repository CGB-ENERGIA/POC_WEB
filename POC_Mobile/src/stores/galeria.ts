import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  dbSalvarFoto,
  dbListarFotos,
  dbExcluirFoto,
  type FotoEntry,
} from "@/utils/galeria-db";

export type { FotoEntry };

export const useGaleriaStore = defineStore("galeria", () => {
  const fotos      = ref<FotoEntry[]>([]);
  const carregando = ref(false);
  let   iniciado   = false;

  async function carregar() {
    if (iniciado) return;
    iniciado = true;
    carregando.value = true;
    try {
      const todas = await dbListarFotos();
      fotos.value = todas.sort((a, b) => b.dataHora.localeCompare(a.dataHora));
    } finally {
      carregando.value = false;
    }
  }

  async function adicionarFoto(blob: Blob, matricula: string): Promise<FotoEntry> {
    const entry: FotoEntry = {
      id:       `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      matricula,
      dataHora: new Date().toISOString(),
      blob,
      tamanho:  blob.size,
    };
    await dbSalvarFoto(entry);
    fotos.value.unshift(entry);
    return entry;
  }

  async function excluirFoto(id: string) {
    await dbExcluirFoto(id);
    const idx = fotos.value.findIndex((f) => f.id === id);
    if (idx !== -1) fotos.value.splice(idx, 1);
  }

  function forcarRecarregar() {
    iniciado = false;
    fotos.value = [];
    return carregar();
  }

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
    fotos, carregando,
    carregar, adicionarFoto, excluirFoto, forcarRecarregar,
    porData, total, tamanhoTotalBytes,
  };
});
