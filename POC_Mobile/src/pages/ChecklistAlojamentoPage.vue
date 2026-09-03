<template>
  <ChecklistGenericoPage
    titulo="Checklist Alojamento"
    auditagem="ALOJAMENTO"
    :checklist="alojamentoChecklist"
    :total-perguntas="totalPerguntasAlojamento"
  />
</template>

<script setup lang="ts">
import ChecklistGenericoPage from "./ChecklistGenericoPage.vue";
import { alojamentoChecklist, totalPerguntasAlojamento } from "@/data/alojamento-checklist";
</script>
