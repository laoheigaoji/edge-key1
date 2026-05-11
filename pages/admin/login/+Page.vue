<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
    <section class="card w-full max-w-md bg-base-100 shadow-sm">
      <div class="card-body space-y-4">
        <div>
          <p class="text-sm uppercase tracking-[0.2em] text-primary">EdgeKey Admin</p>
          <h1 class="text-2xl font-bold">后台登录</h1>
        </div>
        <p class="text-sm text-base-content/70">
          使用管理员账号登录后台，进行商品、库存、订单和支付配置管理。
        </p>
        <div v-if="errorMsg" class="alert alert-error text-sm">{{ errorMsg }}</div>
        <form class="space-y-4" method="post" action="/api/auth/callback/credentials?callbackUrl=/admin">
          <input type="hidden" name="csrfToken" :value="csrfToken" />
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">用户名</span>
            <input name="username" class="input input-bordered w-full" placeholder="admin" required />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">密码</span>
            <input name="password" type="password" class="input input-bordered w-full" placeholder="请输入密码" required />
          </label>
          <AppButton type="submit" variant="primary" :loading="loading" :disabled="!csrfToken" block>
            登录后台
          </AppButton>
        </form>
        <div class="rounded-box bg-base-200 p-3 text-xs text-base-content/70">
          首次初始化完成后，请立即前往“个人资料”修改管理员密码。
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppButton from "../../../components/AppButton.vue";

const csrfToken = ref("");
const loading = ref(true);
const errorMsg = ref("");

const ERROR_MAP: Record<string, string> = {
  CredentialsSignin: "用户名或密码错误",
  password_upgrade_failed: "登录成功但密码升级失败，请重置密码后重试",
};

onMounted(async () => {
  const params = new URLSearchParams(location.search);
  const code = params.get("code") ?? params.get("error");
  if (code) errorMsg.value = ERROR_MAP[code] ?? "登录失败，请重试";
  try {
    const response = await fetch("/api/auth/csrf", {
      credentials: "same-origin",
    });
    const data = (await response.json()) as { csrfToken?: string };
    csrfToken.value = data.csrfToken ?? "";
  } finally {
    loading.value = false;
  }
});
</script>
