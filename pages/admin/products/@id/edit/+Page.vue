<template>
  <ProductForm
    :title="`编辑商品 #${productId}`"
    :categories="categories"
    :initial-value="
      product
        ? {
            id: product.id,
            categoryId: product.categoryId ? String(product.categoryId) : '',
            name: product.name,
            slug: product.slug,
            subtitle: product.subtitle ?? '',
            coverImage: product.coverImage ?? '',
            description: product.description ?? '',
            price: product.price,
            status: product.status,
            minBuy: product.minBuy,
            maxBuy: product.maxBuy,
            sort: product.sort,
            purchaseNote: product.purchaseNote ?? '',
          }
        : undefined
    "
  />
</template>

<script setup lang="ts">
import ProductForm from "../../ProductForm.vue";
import { useData } from "vike-vue/useData";
import type { Data } from "./+data";

const { productId, categories, product } = useData<Data>();
</script>
