<template>
  <div class="space-y-8">

    <section class="relative pt-12">
      <img class="hero-img pointer-events-none" src="../../assets/home-n.png" alt="hero-img">
      <div class="relative rounded-box bg-base-100 shadow-sm overflow-hidden">
        <!-- 背景装饰 -->
        <div class="pointer-events-none absolute inset-0 opacity-[0.03]" aria-hidden="true">
          <div class="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary"></div>
          <div class="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-secondary"></div>
        </div>

        <div class="relative flex flex-col gap-6 px-8 py-8 lg:flex-row lg:items-center lg:justify-between">
          <!-- 左侧文字 -->
          <div class="space-y-4 max-w-lg">
            <div class="badge badge-primary badge-outline font-semibold tracking-widest uppercase">
              {{ site.siteSubtitle || 'Welcome' }}
            </div>
            <p v-if="site.notice" class="text-base-content/60 text-sm leading-relaxed border-l-2 border-primary pl-3">
              {{ site.notice }}
            </p>
          </div>

          <!-- 右侧统计 -->
          <div class="stats mr-32 bg-base-200 shadow shrink-0 max-lg:w-full">
            <!-- <div class="stat">
              <div class="stat-figure text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h8" />
                </svg>
              </div>
              <div class="stat-title">商品分类</div>
              <div class="stat-value text-primary">{{ catalog.categories.length }}</div>
            </div> -->
            <div class="stat">
              <div class="stat-title text-center">在售商品</div>
              <div class="flex text-secondary">
                <div class="stat-value mr-2 text-secondary">{{ catalog.products.length }}</div>
                <div class="stat-figure flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="size-8" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold">商品列表</h2>
      </div>

      <div v-if="catalog.categories.length" class="flex flex-wrap gap-2 mb-6">
        <button
          class="btn btn-sm"
          :class="activeCategoryId === null ? 'btn-primary' : 'btn-outline'"
          @click="activeCategoryId = null"
        >
          全部商品
        </button>
        <button
          v-for="category in catalog.categories"
          :key="category.id"
          class="btn btn-sm"
          :class="activeCategoryId === category.id ? 'btn-primary' : 'btn-outline'"
          @click="activeCategoryId = category.id"
        >
          {{ category.name }}
        </button>
      </div>

      <div v-if="filteredProducts.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article v-for="product in filteredProducts" :key="product.id" class="card relative h-[386px] origin-top scale-[0.92] shadow-2xl overflow-hidden group rounded-[18px] bg-gray-900 hover:-translate-y-1 transition-all duration-300">
          
          <!-- 1. 商品背景图片（全幅插画风格，悬停微动） -->
          <div 
            class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
            :style="{ backgroundImage: `url(${product.coverImage || emptyCoverUrl})` }"
          ></div>
          
          <!-- 2. 边框层（你的 border.png，铺满全层） -->
          <img class="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill opacity-95" src="../../assets/border.png" alt="border" />


          <div class="relative z-20 flex items-start justify-between px-5 pt-[46px] pl-10">
            <div class="absolute -top-6 right-1 flex items-center rounded-sm bg-gradient-to-b from-gray-100 to-gray-300 px-2.5 py-0.5 text-[11px] font-black italic tracking-wider text-gray-800 shadow-[1px_1px_2px_rgba(0,0,0,0.4)] border border-gray-400">
              {{ product.categoryName || 'Basic' }}
            </div>

            <div class="flex flex-col items-start gap-0.5 relative">
              <p class="text-[22px] leading-none font-black italic tracking-widest text-white ml-2 mt-1" style="text-shadow: 2px 2px 0 #000, -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 3px 3px 4px rgba(0,0,0,0.5);">
                {{ product.name }}
              </p>
            </div>
          </div>

          <!-- 4. 底部技能栏 (作为“查看详情”按钮) -->
          <div class="relative z-20 mt-auto flex flex-col justify-end pb-15">
            <!-- 技能条带横幅 -->
            <a :href="`/product/${product.slug}`" class="group/btn relative flex w-full items-center justify-between border-y-2 border-white/40 bg-gradient-to-r from-black/60 via-black/30 to-black/60 px-5 py-3 backdrop-blur-sm transition-colors hover:bg-black/50">
              <div class="flex items-center gap-3">
                <!-- 能量图标 (用 CSS 画出类似宝可梦的能量球) -->
                <div class="flex gap-1">
                  <div class="flex size-6 items-center justify-center rounded-full border-2 border-white bg-yellow-400 shadow-[0_2px_4px_rgba(0,0,0,0.8)]"><div class="size-2.5 rounded-full bg-yellow-600"></div></div>
                  <div class="flex size-6 items-center justify-center rounded-full border-2 border-white bg-sky-400 shadow-[0_2px_4px_rgba(0,0,0,0.8)]"><div class="size-2.5 rounded-full bg-sky-600"></div></div>
                </div>
                <!-- 技能文字 -->
                <span class="text-xl font-black tracking-widest text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] group-hover/btn:text-yellow-300 transition-colors">
                  查看详情
                </span>
              </div>
              <!-- 伤害值 / 箭头 -->
              <span class="text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
                ➤
              </span>
            </a>
            
            <!-- 底部画师/版权说明文字 -->
            <div class="mt-3 text-center">
              <div
                v-if="product.stockMode === 'FINITE' && product.availableStock >= 0 && product.availableStock < 10"
                class="absolute left-5 text-sm font-bold tracking-wide px-2 py-1 rounded-full shadow-lg border"
                :class="product.availableStock === 0 ? 'bg-gray-800/90 text-gray-200 border-gray-600' : 'bg-amber-500/90 text-white border-amber-400 animate-pulse'"
              >
                {{ product.availableStock === 0 ? '已售罄' : `库存紧张(${product.availableStock})` }}
              </div>
              <div class="flex items-end gap-0.5 font-black text-red-500 absolute right-6" style="text-shadow: 2px 2px 0 #fff, -1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 2px 2px 4px rgba(0,0,0,0.3);">
                <span class="text-sm font-bold italic text-red-600 mb-1">¥</span>
                <span class="text-3xl italic leading-none tracking-tighter">{{ formatCents(product.price) }}</span>
              </div>
            </div>
          </div>

        </article>
      </div>

      <div v-else class="rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center text-base-content/60">
        当前还没有上架商品，请先在后台录入分类、商品和库存。
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useData } from "vike-vue/useData";
import { formatCents } from "../../lib/utils/money";
import emptyCoverUrl from "../../assets/empty.jpg";
import type { Data } from "./+data";

const { site, catalog } = useData<Data>();
const activeCategoryId = ref<number | null>(null);
const filteredProducts = computed(() => {
  if (activeCategoryId.value === null) {
    return catalog.products;
  }

  return catalog.products.filter((product) => product.categoryId === activeCategoryId.value);
});
</script>

<style>
.hero-img {
  width: 230px;
  height: auto;
  position: absolute;
  top: -35px;
  right: -22px;
  z-index: 2;
}
.border-img {
  position: absolute;
  top: -10px;
  pointer-events: none;
}
.reflect-below {
  /* 语法: 方向 间距 渐变效果 */
  -webkit-box-reflect: below 2px linear-gradient(transparent, rgba(0,0,0,0.2));
}
</style>
