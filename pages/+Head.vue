<!-- https://vike.dev/Head -->

<template>
  <link rel="icon" :href="faviconUrl" />
</template>

<script setup lang="ts">
import "./tailwind.css";
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import logoUrl from "../assets/logo.svg";

const pageContext = usePageContext();
const faviconUrl = computed(() => pageContext.site?.logoIcon || logoUrl);
</script>
