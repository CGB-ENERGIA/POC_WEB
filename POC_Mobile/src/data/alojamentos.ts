export interface AlojamentoOption {
  value: string;
  label: string;
}

const ALOJ_POR_BASE: Record<string, AlojamentoOption[]> = {
  BCB: [
    { value: "ALOJ01", label: "ALOJ01 – ALTAMIRA" },
    { value: "ALOJ03", label: "ALOJ03 – COROATÁ" },
    { value: "ALOJ04", label: "ALOJ04 – SÃO LUIS GONZAGA" },
    { value: "ALOJ05", label: "ALOJ05 – LAGO VERDE" },
    { value: "ALOJ06", label: "ALOJ06 – PERITORO" },
    { value: "ALOJ07", label: "ALOJ07 – SÃO MATEUS" },
    { value: "ALOJ08", label: "ALOJ08 – VITORINO FREIRE" },
    { value: "ALOJ10", label: "ALOJ10 – BACABAL" },
    { value: "ALOJ11", label: "ALOJ11 – BACABAL" },
    { value: "ALOJ64", label: "ALOJ64 – BACABAL" },
    { value: "ALOJ75", label: "ALOJ75 – BACABAL" },
    { value: "ALOJ76", label: "ALOJ76 – BACABAL" },
  ],
  BDC: [
    { value: "ALOJ13", label: "ALOJ13 – BARRA DO CORDA" },
    { value: "ALOJ15", label: "ALOJ15 – FERNANDO FALCÃO" },
    { value: "ALOJ27", label: "ALOJ27 – BARRA DO CORDA" },
    { value: "ALOJ58", label: "ALOJ58 – BARRA DO CORDA" },
    { value: "ALOJ62", label: "ALOJ62 – BARRA DO CORDA" },
    { value: "ALOJ66", label: "ALOJ66 – BARRA DO CORDA" },
    { value: "ALOJ67", label: "ALOJ67 – BARRA DO CORDA" },
    { value: "ALOJ69", label: "ALOJ69 – BARRA DO CORDA" },
    { value: "ALOJ77", label: "ALOJ77 – BARRA DO CORDA" },
    { value: "ALOJ78", label: "ALOJ78 – BARRA DO CORDA" },
  ],
  ITM: [
    { value: "ALOJ40", label: "ALOJ40 – CANTANHEDE" },
    { value: "ALOJ41", label: "ALOJ41 – ANAJATUBA" },
    { value: "ALOJ42", label: "ALOJ42 – ITAPECURU" },
    { value: "ALOJ43", label: "ALOJ43 – MIRANDA" },
    { value: "ALOJ45", label: "ALOJ45 – ITAPECURU" },
    { value: "ALOJ46", label: "ALOJ46 – ITAPECURU" },
    { value: "ALOJ47", label: "ALOJ47 – ARARI" },
    { value: "ALOJ48", label: "ALOJ48 – VARGEM GRANDE" },
  ],
  PDS: [
    { value: "ALOJ49", label: "ALOJ49 – ESPERANTINÓPOLIS" },
    { value: "ALOJ50", label: "ALOJ50 – IGARAPÉ GRANDE" },
    { value: "ALOJ51", label: "ALOJ51 – PEDREIRAS" },
    { value: "ALOJ52", label: "ALOJ52 – PEDREIRAS" },
    { value: "ALOJ53", label: "ALOJ53 – LAGO DA PEDRA" },
    { value: "ALOJ54", label: "ALOJ54 – PEDREIRAS" },
    { value: "ALOJ56", label: "ALOJ56 – PEDREIRAS" },
    { value: "ALOJ57", label: "ALOJ57 – LAGOA GRANDE" },
  ],
  PDT: [
    { value: "ALOJ14", label: "ALOJ14 – PRESID. DUTRA" },
    { value: "ALOJ16", label: "ALOJ16 – GOV. EUGÊNIO BARROS" },
    { value: "ALOJ17", label: "ALOJ17 – JOSELÂNDIA" },
    { value: "ALOJ19", label: "ALOJ19 – PRESID. DUTRA" },
    { value: "ALOJ20", label: "ALOJ20 – PRESID. DUTRA" },
    { value: "ALOJ21", label: "ALOJ21 – DOM PEDRO" },
    { value: "ALOJ22", label: "ALOJ22 – SÃO DOMINGOS" },
    { value: "ALOJ23", label: "ALOJ23 – PRESID. DUTRA" },
    { value: "ALOJ28", label: "ALOJ28 – PRESID. DUTRA" },
    { value: "ALOJ70", label: "ALOJ70 – PRESID. DUTRA" },
  ],
  STI: [
    { value: "ALOJ30", label: "ALOJ30 – SANTA LUZIA DO TIDÊ" },
    { value: "ALOJ31", label: "ALOJ31 – MONÇÃO" },
    { value: "ALOJ32", label: "ALOJ32 – PIO XII" },
    { value: "ALOJ33", label: "ALOJ33 – SANTA INÊS" },
    { value: "ALOJ35", label: "ALOJ35 – SANTA INÊS" },
    { value: "ALOJ36", label: "ALOJ36 – ALTO AL. PINDARÉ" },
    { value: "ALOJ37", label: "ALOJ37 – ZÉ DOCA" },
    { value: "ALOJ38", label: "ALOJ38 – SANTA INÊS" },
    { value: "ALOJ39", label: "ALOJ39 – SANTA INÊS" },
    { value: "ALOJ61", label: "ALOJ61 – SANTA INÊS" },
    { value: "ALOJ63", label: "ALOJ63 – BOM JARDIM" },
    { value: "ALOJ72", label: "ALOJ72 – SÃO JOÃO DO CARÚ" },
    { value: "ALOJ73", label: "ALOJ73 – SANTA INÊS" },
    { value: "ALOJ74", label: "ALOJ74 – ZÉ DOCA" },
    { value: "ALOJ79", label: "ALOJ79 – SANTA INÊS" },
  ],
};

export function alojamentosPorBase(base: string): AlojamentoOption[] {
  return ALOJ_POR_BASE[base] ?? [];
}
