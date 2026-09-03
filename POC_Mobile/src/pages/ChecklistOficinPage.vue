<template>
  <ChecklistGenericoPage
    titulo="Checklist Oficina"
    auditagem="OFICINA"
    :checklist="oficinaChecklist"
    :total-perguntas="totalPerguntasOficina"
  />
</template>

<script setup lang="ts">
import ChecklistGenericoPage from "./ChecklistGenericoPage.vue";
import { oficinaChecklist, totalPerguntasOficina } from "@/data/oficina-checklist";
</script>
