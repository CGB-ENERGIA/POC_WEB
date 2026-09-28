import { LocalStorage } from "quasar";
import { reactive, ref } from "vue";

export const PRIMEIRO_ACESSO_KEY = "cgb-primeiro-acesso-visto";

export const primeiroAcessoPendente = ref(lerPendente());

/** Estado da tela de identificação, para o guia apontar o controle certo. */
export const identCoach = reactive({
  tela: "ident",
  temColaborador: false,
  digitando: false,
  busca: "",
  menuAberto: false,
  erroBio: false,
  temCamera: false,
  pularBiometria: null as null | (() => void),
});

function lerPendente(): boolean {
  if (typeof window === "undefined") return false;
  return LocalStorage.getItem(PRIMEIRO_ACESSO_KEY) !== true;
}

export function concluirPrimeiroAcesso(): void {
  LocalStorage.set(PRIMEIRO_ACESSO_KEY, true);
  primeiroAcessoPendente.value = false;
}
