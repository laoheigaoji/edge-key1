<template>
  <div v-if="!product" class="alert alert-warning">商品不存在或未上架。</div>
  <div v-else class="grid gap-6 lg:grid-cols-[2fr_1fr]">
    <section class="card bg-base-100 shadow-sm overflow-hidden">
      <figure class="w-full bg-base-200">
        <img :src="product.coverImage || emptyCoverUrl" :alt="product.name" class="w-full object-cover max-h-96" />
      </figure>
      <div class="card-body space-y-4">
        <div>
          <p class="text-sm uppercase tracking-[0.2em] text-primary">Product</p>
          <h1 class="text-3xl font-bold">{{ product.name }}</h1>
          <p class="mt-2 text-base-content/70">{{ product.subtitle }}</p>
        </div>
        <div class="prose max-w-none text-base-content/80" v-html="descriptionHtml"></div>
        <div class="rounded-box bg-base-200 p-4 text-sm text-base-content/80">
          {{ product.purchaseNote || '下单后将生成待支付订单，支付成功后会给您的联系邮箱发送通知，请注意查看。' }}
        </div>
      </div>
    </section>

    <aside>
      <div class="lg:sticky lg:top-24 card bg-base-100 shadow-sm">
        <div class="card-body space-y-4">
          <div>
            <div class="text-sm text-base-content/60">当前价格</div>
            <div class="text-3xl font-bold text-primary">{{ formatCents(product.price) }}</div>
          </div>
          <div class="text-sm text-base-content/70">限购 {{ product.minBuy }} - {{ product.maxBuy }} 件</div>

          <div class="divider my-0"></div>

          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">联系邮箱</span>
            <input v-model="form.contactValue" type="email" class="input input-bordered w-full" placeholder="name@example.com" />
          </label>
          <p class="-mt-2 text-xs text-base-content/60">必填，自动发货和售后联系都会发送到这个邮箱。</p>

          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">购买数量</span>
            <input v-model.number="form.quantity" type="number" :min="product.minBuy" :max="product.maxBuy" class="input input-bordered w-full" />
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">备注</span>
            <textarea v-model="form.buyerNote" class="textarea textarea-bordered w-full" rows="3" placeholder="可以留下QQ号、微信等联系方式"></textarea>
          </label>

          <div class="space-y-2">
            <div class="text-sm font-medium">支付方式</div>
            <div class="grid gap-3">
              <label v-for="method in paymentMethods" :key="method.provider" class="rounded-box border border-base-300 p-4">
                <div class="flex items-center justify-between gap-3">
                  <span>{{ method.label }}</span>
                  <input v-model="form.paymentProvider" type="radio" class="radio radio-primary radio-sm" :value="method.provider" />
                </div>
              </label>
            </div>
          </div>

          <div v-if="form.paymentProvider === 'EPAY'" class="space-y-2">
            <div class="text-sm font-medium">易支付渠道</div>
            <div class="grid gap-3 md:grid-cols-2">
              <label v-for="channel in epayChannels" :key="channel.value" class="rounded-box border border-base-300 p-4">
                <div class="flex items-center justify-between gap-3">
                  <span>{{ channel.label }}</span>
                  <input v-model="form.paymentChannel" type="radio" class="radio radio-primary radio-sm" :value="channel.value" />
                </div>
              </label>
            </div>
          </div>



          <p v-if="product.stockMode === 'FINITE' && product.availableStock >= 0 && product.availableStock < 10" class="text-sm" :class="product.availableStock === 0 ? 'text-error' : 'text-warning'">
            {{ product.availableStock === 0 ? '商品都卖光了，看看其他商品' : `库存紧张，仅剩 ${product.availableStock} 件` }}
          </p>

          <AppButton variant="primary" :loading="submitting" :disabled="!paymentMethods.length || (product.stockMode === 'FINITE' && product.availableStock === 0)" @click="handleCreateOrder">
            {{ product.stockMode === 'FINITE' && product.availableStock === 0 ? '已售罄' : '提交订单' }}
          </AppButton>
          <p v-if="!paymentMethods.length" class="text-sm text-warning">当前没有可用支付方式，请联系管理员启用支付配置。</p>
          <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import AppButton from "../../../components/AppButton.vue";
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref } from "vue";
import { useData } from "vike-vue/useData";
import { isEmail } from "../../../lib/validators/email";
import { formatCents } from "../../../lib/utils/money";
import { onCreateOrder } from "./createOrder.telefunc";
import type { PaymentProvider } from "../../../modules/payment/types";
import { isMobile } from "../../../lib/utils/device";
import { onMounted, watch } from "vue";
import { saveLocalOrder } from "../../../lib/local-orders";
import type { Data } from "./+data";

import emptyCoverUrl from "../../../assets/empty.jpg";

const { product, paymentMethods } = useData<Data>();
const submitting = ref(false);
const errorMessage = ref("");
const epayChannels = [
  { value: "alipay", label: "支付宝" },
  { value: "wxpay", label: "微信支付" },
] as const;



const form = reactive({
  quantity: product?.minBuy ?? 1,
  contactValue: "",
  buyerNote: "",
  paymentProvider: (paymentMethods[0]?.provider ?? "BEPUSDT") as PaymentProvider,
  paymentChannel: "alipay_h5",
});

let mobile = false;
onMounted(() => {
  mobile = isMobile();
  form.paymentChannel = mobile ? "alipay_h5" : "alipay_pc";
});

watch(() => form.paymentProvider, (provider) => {
  if (provider === "EPAY") form.paymentChannel = "alipay";
  else if (provider === "ALIPAY") form.paymentChannel = mobile ? "alipay_h5" : "alipay_pc";
  else form.paymentChannel = "";
});

const descriptionHtml = formatDescriptionHtml(product?.description || "");

async function handleCreateOrder() {
  if (!product) return;

  const contactEmail = form.contactValue.trim();
  if (!contactEmail) {
    errorMessage.value = "联系邮箱不能为空";
    return;
  }

  if (!isEmail(contactEmail)) {
    errorMessage.value = "联系邮箱格式不正确";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";

  try {
    const result = await onCreateOrder({
      productId: product.id,
      quantity: form.quantity,
      paymentProvider: form.paymentProvider,
      paymentChannel: form.paymentProvider === "EPAY" || form.paymentProvider === "ALIPAY" ? form.paymentChannel : undefined,
      contactType: "EMAIL",
      contactValue: contactEmail,
      buyerNote: form.buyerNote,
    });

    saveLocalOrder({
      orderNo: result.orderNo,
      queryToken: result.queryToken,
      productName: product.name,
      amount: result.amount,
      createdAt: new Date().toISOString(),
      paymentStatus: result.paymentStatus ?? 'UNPAID',
    });

    if (result.payUrl) {
      window.location.href = result.payUrl;
      return;
    }

    window.location.href = `/order/${result.orderNo}?token=${encodeURIComponent(result.queryToken)}`;
  } catch (error) {
    errorMessage.value = normalizeTelefuncError(error, "下单失败");
  } finally {
    submitting.value = false;
  }
}

function formatDescriptionHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "<p>暂无商品描述。</p>";
  }

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }

  return `<p>${escapeHtml(trimmed).replace(/\r?\n/g, "<br>")}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
</script>

<style scoped>
:deep(.prose img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 1rem auto;
  border-radius: 0.85rem;
}
</style>
