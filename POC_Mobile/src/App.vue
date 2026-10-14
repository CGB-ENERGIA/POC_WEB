<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useQuasar } from "quasar";
import { detectarQuedaDaCamera } from "@/utils/camera-mode";

const $q = useQuasar();

onMounted(() => {
  if (!detectarQuedaDaCamera()) return;
  $q.notify({
    type: "warning",
    position: "top",
    timeout: 9000,
    multiLine: true,
    message:
      "O celular fechou o app ao abrir a câmera (pouca memória) e a última foto não foi salva. " +
      "Tire a foto de novo: neste aparelho a câmera agora abre dentro do app.",
    actions: [{ label: "OK", color: "white" }],
  });
});
</script>
