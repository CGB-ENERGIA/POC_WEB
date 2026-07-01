<template>
  <div
    class="brand-logo"
    :class="{
      'brand-logo--stacked': stacked,
      'brand-logo--on-dark': onDark,
      'brand-logo--header': header,
    }"
  >
    <div class="brand-logo__mark" :style="markStyle">
      <img :src="LOGO_URL" alt="CGB Engenharia" class="brand-logo__img" />
    </div>
    <div v-if="showText" class="brand-logo__text">
      <div class="brand-logo__title">{{ title }}</div>
      <div v-if="subtitle" class="brand-logo__subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useQuasar } from "quasar";
import { BRAND, LOGO_URL } from "@/constants/brand";

const $q = useQuasar();
const onDark = computed(() => $q.dark.isActive);

const props = withDefaults(
  defineProps<{
    size?: number;
    showText?: boolean;
    stacked?: boolean;
    header?: boolean;
    title?: string;
    subtitle?: string;
  }>(),
  {
    size: 48,
    showText: false,
    stacked: false,
    header: false,
    title: BRAND.product,
    subtitle: BRAND.tagline,
  }
);

const markStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));
</script>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.brand-logo--stacked {
  flex-direction: column;
  text-align: center;
  gap: 14px;
}

.brand-logo--header .brand-logo__mark {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}

.brand-logo--header .brand-logo__img {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
}

.brand-logo--header .brand-logo__title {
  color: #fff;
  font-size: 1rem;
}

.brand-logo--header .brand-logo__subtitle {
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.75rem;
}

.brand-logo__mark {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(122, 18, 37, 0.12);
  padding: 6px;
}

.brand-logo__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-logo__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.brand-logo__subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.brand-logo--on-dark .brand-logo__title {
  color: #f8fafc;
}

.brand-logo--on-dark .brand-logo__subtitle {
  color: #94a3b8;
}
</style>
