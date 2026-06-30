<template>
  <div
    class="brand-logo"
    :class="{
      'brand-logo--stacked': stacked,
      'brand-logo--inverse': inverse,
      'brand-logo--compact': compact,
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
import { BRAND, LOGO_URL } from "@/constants/brand";

const props = withDefaults(
  defineProps<{
    size?: number;
    showText?: boolean;
    stacked?: boolean;
    compact?: boolean;
    inverse?: boolean;
    title?: string;
    subtitle?: string;
  }>(),
  {
    size: 44,
    showText: true,
    stacked: false,
    compact: false,
    inverse: false,
    title: BRAND.name,
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
  min-width: 0;
}

.brand-logo--stacked {
  flex-direction: column;
  text-align: center;
  gap: 14px;
}

.brand-logo--compact {
  gap: 10px;
}

.brand-logo__mark {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(122, 18, 37, 0.14);
  padding: 5px;
}

.brand-logo--inverse .brand-logo__mark {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

.brand-logo__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.brand-logo__text {
  min-width: 0;
}

.brand-logo__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  letter-spacing: 0.01em;
}

.brand-logo--compact .brand-logo__title {
  font-size: 0.9375rem;
}

.brand-logo__subtitle {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.3;
}

.brand-logo--inverse .brand-logo__title {
  color: #fff;
}

.brand-logo--inverse .brand-logo__subtitle {
  color: rgba(255, 255, 255, 0.78);
}
</style>
