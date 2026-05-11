<template>
  <section class="space-y-6">
    <div class="alert alert-info">
      <span class="text-white">启用支付前，请先前往"站点设置"配置网站地址，否则无法获取支付结果。</span>
    </div>
    <div role="tablist" class="tabs tabs-border">
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'BEPUSDT' }" @click="activeTab = 'BEPUSDT'">
        BEpusdt
        <span v-if="localConfigs.BEPUSDT?.isEnabled" class="ml-1.5 inline-block w-2 h-2 rounded-full bg-success"></span>
      </a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'EPAY' }" @click="activeTab = 'EPAY'">
        Epay
        <span v-if="localConfigs.EPAY?.isEnabled" class="ml-1.5 inline-block w-2 h-2 rounded-full bg-success"></span>
      </a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'ALIPAY' }" @click="activeTab = 'ALIPAY'">
        支付宝
        <span v-if="localConfigs.ALIPAY?.isEnabled" class="ml-1.5 inline-block w-2 h-2 rounded-full bg-success"></span>
      </a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'STRIPE' }" @click="activeTab = 'STRIPE'">
        Stripe
        <span v-if="localConfigs.STRIPE?.isEnabled" class="ml-1.5 inline-block w-2 h-2 rounded-full bg-success"></span>
      </a>
    </div>
    <PaymentConfigCard v-if="activeTab === 'BEPUSDT'" provider="BEPUSDT" title="Usdt/Usdc(数字货币)" :initial-value="localConfigs.BEPUSDT" @saved="localConfigs.BEPUSDT = $event" />
    <PaymentConfigCard v-if="activeTab === 'EPAY'" provider="EPAY" title="易支付(聚合支付)" :initial-value="localConfigs.EPAY" @saved="localConfigs.EPAY = $event" />
    <PaymentConfigCard v-if="activeTab === 'ALIPAY'" provider="ALIPAY" title="支付宝(官方)" :initial-value="localConfigs.ALIPAY" @saved="localConfigs.ALIPAY = $event" />
    <PaymentConfigCard v-if="activeTab === 'STRIPE'" provider="STRIPE" title="Stripe(信用卡)" :initial-value="localConfigs.STRIPE" @saved="localConfigs.STRIPE = $event" />
  </section>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useData } from "vike-vue/useData";
import PaymentConfigCard from "./PaymentConfigCard.vue";
import type { Data } from "./+data";

const { configs } = useData<Data>();
const activeTab = ref("BEPUSDT");
const localConfigs = reactive<Record<string, any>>({ ...configs });
</script>