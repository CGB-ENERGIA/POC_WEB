<template>
  <ChecklistGenericoPage
    titulo="Checklist Logística"
    auditagem="LOGISTICA"
    :checklist="logisticaChecklist"
    :total-perguntas="totalPerguntasLogistica"
  />
</template>

<script setup lang="ts">
import ChecklistGenericoPage from "./ChecklistGenericoPage.vue";
import { logisticaChecklist, totalPerguntasLogistica } from "@/data/logistica-checklist";
</script>
