import { ref, computed } from "vue";

const STORAGE_KEY = "cgb_metas_v1";

interface GoalConfig {
  normais_semanal: number;
  seguranca_semanal: number;
}

const DEFAULTS: GoalConfig = {
  normais_semanal: 2,
  seguranca_semanal: 5,
};

function loadConfig(): GoalConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GoalConfig>;
    return {
      normais_semanal:   Number(parsed.normais_semanal)   || DEFAULTS.normais_semanal,
      seguranca_semanal: Number(parsed.seguranca_semanal) || DEFAULTS.seguranca_semanal,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

// Estado global compartilhado entre composables
const config = ref<GoalConfig>(loadConfig());

export function useGoals() {
  const normaisSemanal   = computed(() => config.value.normais_semanal);
  const normaisMensal    = computed(() => config.value.normais_semanal * 4);
  const segurancaSemanal = computed(() => config.value.seguranca_semanal);
  const segurancaMensal  = computed(() => config.value.seguranca_semanal * 4);

  function save(normaisSem: number, segurancaSem: number) {
    config.value = {
      normais_semanal:   normaisSem,
      seguranca_semanal: segurancaSem,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value));
  }

  function goalForGerencia(gerencia: string | undefined): { semanal: number; mensal: number } {
    const isSesmt = gerencia === "SESMT";
    return {
      semanal: isSesmt ? config.value.seguranca_semanal : config.value.normais_semanal,
      mensal:  isSesmt ? config.value.seguranca_semanal * 4 : config.value.normais_semanal * 4,
    };
  }

  return {
    normaisSemanal,
    normaisMensal,
    segurancaSemanal,
    segurancaMensal,
    save,
    goalForGerencia,
  };
}
