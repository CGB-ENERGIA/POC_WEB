<template>
  <q-item
    v-if="external"
    clickable
    tag="a"
    :href="link"
    target="_self"
  >
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ label }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>

    <q-item-section side>
      <q-icon name="mdi-open-in-new" size="16px" color="grey-5" />
    </q-item-section>
  </q-item>

  <q-item v-else clickable :to="link" exact>
    <q-item-section v-if="icon" avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ label }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
export interface EssentialLinkProps {
  label: string;
  caption?: string;
  link?: string;
  icon?: string;
  external?: boolean;
}

withDefaults(defineProps<EssentialLinkProps>(), {
  caption: "",
  link: "#",
  icon: "",
  external: false,
});
</script>
