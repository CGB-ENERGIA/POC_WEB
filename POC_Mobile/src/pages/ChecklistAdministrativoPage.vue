<template>
  <ChecklistGenericoPage
    titulo="Checklist Administrativo"
    auditagem="ADMINISTRATIVO"
    :checklist="administrativoChecklist"
    :total-perguntas="totalPerguntasAdministrativo"
  />
</template>

<script setup lang="ts">
import ChecklistGenericoPage from "./ChecklistGenericoPage.vue";
import { administrativoChecklist, totalPerguntasAdministrativo } from "@/data/administrativo-checklist";
</script>
