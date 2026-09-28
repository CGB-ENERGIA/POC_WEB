import { LocalStorage } from "quasar";
import { ref } from "vue";

export const PRIMEIRO_ACESSO_KEY = "cgb-primeiro-acesso-visto";

export const primeiroAcessoPendente = ref(lerPendente());

function lerPendente(): boolean {
  if (typeof window === "undefined") return false;
  return LocalStorage.getItem(PRIMEIRO_ACESSO_KEY) !== true;
}

export function concluirPrimeiroAcesso(): void {
  LocalStorage.set(PRIMEIRO_ACESSO_KEY, true);
  primeiroAcessoPendente.value = false;
}
