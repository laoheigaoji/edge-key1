<template>
  <ProductForm title="新建商品" :categories="categories" />
</template>

<script setup lang="ts">
import ProductForm from "../ProductForm.vue";
import { useData } from "vike-vue/useData";
import type { Data } from "./+data";

const { categories } = useData<Data>();
</script>
