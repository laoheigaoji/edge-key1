<template>
  <dialog class="modal modal-open" @click.self="$emit('close')">
    <div class="modal-box max-w-2xl w-full">
      <h3 class="font-bold text-lg mb-4">S3 存储配置</h3>

      <div class="space-y-4">
        <!-- Endpoint -->
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">S3 端点 <span class="text-error">*</span></span>
          <input
            v-model="form.endpoint"
            class="input input-bordered w-full"
            placeholder="https://s3.amazonaws.com"
          />
          <span class="text-xs text-base-content/50">
            示例：Cloudflare R2: https://&lt;account_id&gt;.r2.cloudflarestorage.com | AWS S3: https://s3.amazonaws.com
          </span>
        </label>

        <!-- Access Key -->
        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">Access Key ID <span class="text-error">*</span></span>
            <input
              v-model="form.accessKeyId"
              class="input input-bordered w-full"
              placeholder="AKIAIOSFODNN7EXAMPLE"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">Secret Access Key <span class="text-error">*</span></span>
            <input
              v-model="form.secretAccessKey"
              type="password"
              class="input input-bordered w-full"
              placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
            />
          </label>
        </div>

        <!-- Bucket & Region -->
        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">存储桶名称 <span class="text-error">*</span></span>
            <input
              v-model="form.bucketName"
              class="input input-bordered w-full"
              placeholder="my-bucket"
            />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">区域</span>
            <input
              v-model="form.region"
              class="input input-bordered w-full"
              placeholder="auto"
            />
          </label>
        </div>

        <!-- Public Domain -->
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">公开访问域名（可选）</span>
          <input
            v-model="form.publicDomain"
            class="input input-bordered w-full"
            placeholder="https://cdn.example.com"
          />
          <span class="text-xs text-base-content/50">
            如果配置了自定义域名或 CDN，填写后文件将通过此域名访问
          </span>
        </label>

        <!-- Path Prefix -->
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">路径前缀（可选）</span>
          <input
            v-model="form.pathPrefix"
            class="input input-bordered w-full"
            placeholder="media"
          />
          <span class="text-xs text-base-content/50">
            上传文件会自动添加此前缀，例如填写 media，文件将存储到 media/ 目录下
          </span>
        </label>

        <!-- Cache Control -->
        <label class="flex flex-col gap-1.5">
          <span class="label-text font-medium">缓存策略</span>
          <input
            v-model="form.cacheControl"
            class="input input-bordered w-full"
            placeholder="public, max-age=31536000, immutable"
          />
          <span class="text-xs text-base-content/50">
            Cache-Control 头，用于 Cloudflare 缓存。默认 1 年不变更缓存
          </span>
        </label>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert alert-error mt-4">
        <span class="text-sm">{{ error }}</span>
      </div>

      <!-- Test Result -->
      <div v-if="testResult" class="mt-4" :class="testResult.ok ? 'text-success' : 'text-error'">
        <p class="text-sm">{{ testResult.message }}</p>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <AppButton variant="outline" :loading="testing" @click="handleTest">测试连接</AppButton>
        <div class="flex-1"></div>
        <button class="btn" @click="$emit('close')">取消</button>
        <AppButton variant="primary" :loading="saving" @click="handleSave">保存配置</AppButton>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">关闭</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import AppButton from "../../../../components/AppButton.vue";
import { normalizeTelefuncError } from "../../../../lib/app-error";
import { onTestS3Connection } from "../testS3Connection.telefunc";
import type { S3ConfigInput } from "../../../../modules/media/types";

const props = defineProps<{
  config: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    region: string;
    publicDomain: string | null;
    pathPrefix: string | null;
    cacheControl: string;
  } | null;
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [input: S3ConfigInput];
}>();

const form = reactive({
  endpoint: props.config?.endpoint || "",
  accessKeyId: props.config?.accessKeyId || "",
  secretAccessKey: props.config?.secretAccessKey || "",
  bucketName: props.config?.bucketName || "",
  region: props.config?.region || "auto",
  publicDomain: props.config?.publicDomain || "",
  pathPrefix: props.config?.pathPrefix || "",
  cacheControl: props.config?.cacheControl || "public, max-age=31536000, immutable",
});

function handleSave() {
  emit("save", {
    endpoint: form.endpoint,
    accessKeyId: form.accessKeyId,
    secretAccessKey: form.secretAccessKey,
    bucketName: form.bucketName,
    region: form.region,
    publicDomain: form.publicDomain || undefined,
    pathPrefix: form.pathPrefix || undefined,
    cacheControl: form.cacheControl,
  });
}

const testing = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

async function handleTest() {
  testing.value = true;
  testResult.value = null;

  try {
    const result = await onTestS3Connection({
      endpoint: form.endpoint,
      accessKeyId: form.accessKeyId,
      secretAccessKey: form.secretAccessKey,
      bucketName: form.bucketName,
      region: form.region,
      publicDomain: form.publicDomain || undefined,
      pathPrefix: form.pathPrefix || undefined,
      cacheControl: form.cacheControl,
    });
    testResult.value = result;
  } catch (error) {
    testResult.value = { ok: false, message: normalizeTelefuncError(error, "测试失败") };
  } finally {
    testing.value = false;
  }
}
</script>
