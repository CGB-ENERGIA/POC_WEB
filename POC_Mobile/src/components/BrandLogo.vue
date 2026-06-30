<template>
  <div class="brand-logo" :class="{ 'brand-logo--stacked': stacked }">
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
import { BRAND, LOGO_URL } from "@/constants/brand";

const props = withDefaults(
  defineProps<{
    size?: number;
    showText?: boolean;
    stacked?: boolean;
    title?: string;
    subtitle?: string;
  }>(),
  {
    size: 48,
    showText: false,
    stacked: false,
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
</style>
