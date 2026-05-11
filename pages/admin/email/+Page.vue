<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <h1 class="text-2xl font-bold">邮件管理</h1>
        <p class="text-sm text-base-content/70">配置邮件发送通道、推送开关、日志列表和模板。</p>
      </div>
    </div>

    <div role="tablist" class="tabs tabs-border">
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'stats' }" @click="activeTab = 'stats'">统计</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'config' }" @click="activeTab = 'config'">配置</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'list' }" @click="activeTab = 'list'">日志</a>
      <a role="tab" class="tab" :class="{ 'tab-active': activeTab === 'template' }" @click="activeTab = 'template'">模板</a>
    </div>

    <!-- ==================== 统计 ==================== -->
    <section v-if="activeTab === 'stats'" class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article v-for="metric in metrics" :key="metric.label" class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <div class="text-sm text-base-content/60">{{ metric.label }}</div>
            <div class="text-3xl font-bold">{{ metric.value }}</div>
          </div>
        </article>
      </div>
    </section>

    <!-- ==================== 配置 ==================== -->
    <section v-if="activeTab === 'config'" class="space-y-6">
      <!-- 1. 消息推送配置 -->
      <section class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">消息推送设置</h2>
              <p class="text-sm text-base-content/70">全局推送开关，对当前激活状态的邮局有效。</p>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="font-semibold text-base-content/80">发给客户</h3>
            <div class="grid gap-4 md:grid-cols-3">
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.customerSendOrderPaidEmail" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text font-medium">支付成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.customerSendDeliverySuccessEmail" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text font-medium">发货成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.customerSendDeliveryFailedEmail" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text font-medium">发货失败发送</span>
              </label>
            </div>
          </div>

          <div class="space-y-2 mt-4">
            <h3 class="font-semibold text-base-content/80">发给管理员 (需在个人资料配置邮箱)</h3>
            <div class="grid gap-4 md:grid-cols-3">
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.adminSendOrderPaidEmail" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text font-medium">支付成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.adminSendDeliverySuccessEmail" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text font-medium">发货成功发送</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="pushSettings.adminSendDeliveryFailedEmail" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text font-medium">发货失败发送</span>
              </label>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <AppButton size="sm" variant="primary" :loading="savingPushSettings" @click="handleSavePushSettings">保存推送设置</AppButton>
            <span v-if="pushSettingsMessage" class="text-sm" :class="pushSettingsError ? 'text-error' : 'text-success'">
              {{ pushSettingsMessage }}
            </span>
          </div>
        </div>
      </section>

      <!-- 2. 邮局列表 -->
      <section class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">邮局列表</h2>
              <p class="text-sm text-base-content/70">支持添加多个邮局配置，可自由选择激活其中一个用于发信。</p>
            </div>
            <AppButton size="sm" variant="primary" @click="openCreateDialog">新增邮局</AppButton>
          </div>

          <div v-if="!mailboxList.length" class="text-center py-8 text-base-content/50">
            暂无邮局配置，点击上方"新增邮局"按钮添加
          </div>

          <div class="overflow-x-auto" v-else>
            <table class="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>名称</th>
                  <th>类型</th>
                  <th>发件邮箱</th>
                  <th>服务商/地址</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in mailboxList" :key="item.id">
                  <td class="font-mono text-sm">{{ item.id }}</td>
                  <td>{{ item.name || '-' }}</td>
                  <td>
                    <StatusTag variant="outline">{{ getChannelLabel(item.provider) }}</StatusTag>
                  </td>
                  <td>{{ item.fromEmail || '-' }}</td>
                  <td>
                    <span v-if="item.provider === 'API'">{{ (item as any).apiProvider || '-' }}</span>
                    <span v-else-if="item.provider === 'SMTP'">{{ (item as any).smtpHost || '-' }}</span>
                    <span v-else>{{ (item as any).cloudflareBindingName || '-' }}</span>
                  </td>
                  <td>
                    <StatusTag :type="item.isEnabled ? 'success' : 'default'">
                      {{ item.isEnabled ? '已激活' : '未激活' }}
                    </StatusTag>
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <AppButton size="xs" variant="outline" @click="openEditDialog(item)">编辑</AppButton>
                      <AppButton size="xs" variant="outline" @click="openTestModal(item)">测试</AppButton>
                      <AppButton size="xs" :variant="item.isEnabled ? 'default' : 'primary'" :disabled="item.isEnabled" @click="handleActivate(item)">{{ item.isEnabled ? '当前激活' : '激活' }}</AppButton>
                      <AppButton size="xs" variant="danger" :disabled="item.isEnabled" @click="handleDelete(item)">删除</AppButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>

    <!-- ==================== 新增/编辑邮局弹窗 ==================== -->
    <dialog class="modal" :class="{ 'modal-open': showConfigDialog }">
      <div class="modal-box w-11/12 max-w-3xl">
        <h3 class="font-bold text-lg mb-4">{{ editingId ? '编辑邮局' : '新增邮局' }}</h3>

        <div class="space-y-4">
          <!-- 名称 -->
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">邮局名称 (可选，留空自动生成)</span>
            <input v-model="configForm.name" class="input input-bordered w-full" placeholder="例如：Mailjet 主账号" />
          </label>

          <!-- 类型选择 -->
          <label class="flex flex-col gap-1.5 max-w-xs">
            <span class="label-text font-medium">邮件类型</span>
            <select v-model="configForm.provider" class="select select-bordered w-full">
              <option value="API">API</option>
              <option value="SMTP">SMTP</option>
              <option value="CLOUDFLARE">Cloudflare</option>
            </select>
          </label>

          <div class="divider my-0"></div>

          <!-- API Form -->
          <div v-if="configForm.provider === 'API'" class="grid gap-4 md:grid-cols-2">
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">API 服务商</span>
              <select v-model="configForm.apiProvider" class="select select-bordered w-full">
                <option value="BREVO">Brevo</option>
                <option value="MAILJET">Mailjet</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">发件邮箱</span>
              <input v-model="configForm.fromEmail" class="input input-bordered w-full" placeholder="admin@example.com" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">发件人名称</span>
              <input v-model="configForm.fromName" class="input input-bordered w-full" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">回复邮箱</span>
              <input v-model="configForm.replyTo" class="input input-bordered w-full" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">API 地址</span>
              <input v-model="configForm.apiBaseUrl" class="input input-bordered w-full" :placeholder="configForm.apiProvider === 'BREVO' ? 'https://api.brevo.com/v3/smtp/email' : 'https://api.mailjet.com/v3.1/send'" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">API Key</span>
              <SecretInput v-model="configForm.apiKey" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">Secret Key</span>
              <SecretInput v-model="configForm.secretKey" :disabled="configForm.apiProvider !== 'MAILJET'" :placeholder="configForm.apiProvider === 'MAILJET' ? 'Mailjet Secret Key' : 'Brevo 不需要该字段'" />
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">超时(ms)</span>
              <input v-model.number="configForm.timeoutMs" type="number" class="input input-bordered w-full" />
            </label>
          </div>

          <!-- SMTP Form -->
          <div v-if="configForm.provider === 'SMTP'" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">发件邮箱</span>
                <input v-model="configForm.fromEmail" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">发件人名称</span>
                <input v-model="configForm.fromName" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">回复邮箱</span>
                <input v-model="configForm.replyTo" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">SMTP Host</span>
                <input v-model="configForm.smtpHost" class="input input-bordered w-full" placeholder="smtp.example.com" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">SMTP Port</span>
                <input v-model.number="configForm.smtpPort" type="number" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">SMTP 用户名</span>
                <input v-model="configForm.smtpUsername" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">SMTP 密码</span>
                <SecretInput v-model="configForm.smtpPassword" />
              </label><label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">认证方式</span>
                <select v-model="configForm.smtpAuthType" class="select select-bordered w-full">
                  <option value="plain">PLAIN</option>
                  <option value="login">LOGIN</option>
                  <option value="cram-md5">CRAM-MD5</option>
                </select>
              </label>
            </div>
            <label class="label cursor-pointer justify-start gap-3 w-fit">
              <input v-model="configForm.smtpSecure" type="checkbox" class="checkbox checkbox-primary" />
              <span class="label-text font-medium">使用 SMTPS / SSL</span>
            </label>
          </div>

          <!-- Cloudflare Form -->
          <div v-if="configForm.provider === 'CLOUDFLARE'" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">发件邮箱</span>
                <input v-model="configForm.fromEmail" class="input input-bordered w-full" placeholder="sender@your-domain.com" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">发件人名称</span>
                <input v-model="configForm.fromName" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">回复邮箱</span>
                <input v-model="configForm.replyTo" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">Binding 名称</span>
                <input v-model="configForm.cloudflareBindingName" class="input input-bordered w-full" placeholder="SEB" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">目标邮箱</span>
                <input v-model="configForm.cloudflareDestinationAddress" class="input input-bordered w-full" placeholder="you@example.com" />
              </label>
            </div>
            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">允许目标邮箱列表</span>
              <textarea v-model="configForm.cloudflareAllowedText" class="textarea textarea-bordered w-full" rows="3" placeholder="一行一个邮箱"></textarea>
            </label>
          </div>

          <div v-if="configDialogMessage" class="text-sm mt-2" :class="configDialogError ? 'text-error' : 'text-success'">
            {{ configDialogMessage }}
          </div>
        </div>

        <div class="modal-action">
          <AppButton variant="ghost" @click="closeConfigDialog">取消</AppButton>
          <AppButton variant="primary" :loading="savingConfig" @click="handleSaveConfig">{{ editingId ? '更新' : '创建' }}</AppButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeConfigDialog">关闭</button>
      </form>
    </dialog>

    <!-- ==================== 测试发送弹窗 ==================== -->
    <dialog class="modal" :class="{ 'modal-open': showTestModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">测试发送 — {{ testingMailboxName }}</h3>
        <div class="py-4 space-y-4">
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">测试收件邮箱</span>
            <input v-model="testToEmail" class="input input-bordered w-full" placeholder="receiver@example.com" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="label-text font-medium">测试内容</span>
            <textarea v-model="testContent" class="textarea textarea-bordered w-full" rows="5" placeholder="这是一封测试邮件。"></textarea>
          </label>
          <div v-if="testModalMessage" class="text-sm mt-2" :class="testModalError ? 'text-error' : 'text-success'">
            {{ testModalMessage }}
          </div>
        </div>
        <div class="modal-action">
          <AppButton variant="ghost" @click="closeTestModal">关闭</AppButton>
          <AppButton variant="primary" :loading="isTesting" @click="handleSendTest">发送</AppButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeTestModal">关闭</button>
      </form>
    </dialog>

    <!-- ==================== 删除确认弹窗 ==================== -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteConfirm }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">确认删除</h3>
        <p class="py-4">确定要删除邮局配置 <strong>{{ deletingMailboxName }}</strong> 吗？此操作不可恢复。</p>
        <div v-if="deleteMessage" class="text-sm text-error mb-2">{{ deleteMessage }}</div>
        <div class="modal-action">
          <AppButton variant="ghost" @click="closeDeleteConfirm">取消</AppButton>
          <AppButton variant="danger" :loading="deleting" @click="confirmDelete">确认删除</AppButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeDeleteConfirm">关闭</button>
      </form>
    </dialog>

    <!-- ==================== 清除日志确认弹窗 ==================== -->
    <dialog class="modal" :class="{ 'modal-open': showClearConfirm }">
      <div class="modal-box">
        <h3 class="font-bold text-lg">确认清除</h3>
        <p class="py-4">确定要清除所有邮件日志吗？此操作不可恢复。</p>
        <div class="modal-action">
          <AppButton size="sm" variant="ghost" @click="showClearConfirm = false">取消</AppButton>
          <AppButton size="sm" variant="danger" :loading="clearingLogs" @click="handleClearLogs">确认清除</AppButton>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="showClearConfirm = false">关闭</button></form>
    </dialog>

    <!-- ==================== 日志 ==================== -->
    <section v-if="activeTab === 'list'" class="card bg-base-100 shadow-sm">
      <div class="card-body space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-base-content/60">共 {{ logList.length }} 条记录</span>
          <AppButton size="sm" variant="danger" :disabled="!logList.length" @click="showClearConfirm = true">清除日志</AppButton>
        </div>
        <div class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>#</th>
                <th>时间</th>
                <th>分类</th>
                <th>邮箱名称</th>
                <th>场景</th>
                <th>状态</th>
                <th>收件人</th>
                <th>主题</th>
                <th>触发来源</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!logList.length"><td colspan="10" class="text-center text-base-content/60">暂无邮件日志</td></tr>
              <tr v-for="(log, index) in logList" :key="log.id">
                <th>{{ index + 1 }}</th>
                <td class="whitespace-nowrap">{{ formatDate(log.createdAt) }}</td>
                <td class="whitespace-nowrap">{{ getChannelLabel(log.provider) }}</td>
                <td class="whitespace-nowrap">{{ configs.find(c => c.provider === log.provider)?.name || '-' }}</td>
                <td class="whitespace-nowrap">{{ getSceneLabel(log.scene) }}</td>
                <td>
                  <StatusTag class="whitespace-nowrap" :type="log.status === 'SUCCESS' ? 'success' : 'danger'">
                    {{ log.status === 'SUCCESS' ? '成功' : '失败' }}
                  </StatusTag>
                </td>
                <td class="whitespace-nowrap">{{ log.toEmail }}</td>
                <td class="max-w-xs truncate" :title="log.subject">{{ log.subject }}</td>
                <td class="whitespace-nowrap">{{ log.triggeredBy || '-' }}</td>
                <td class="max-w-xs truncate" :title="log.error || log.messageId || ''">{{ log.error || log.messageId || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ==================== 模板 ==================== -->
    <section v-if="activeTab === 'template'" class="space-y-4">
      <div class="card bg-base-100 shadow-sm">
        <div class="card-body space-y-4 p-4 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">邮件模板配置</h2>
              <p class="text-sm text-base-content/70">选择不同场景进行编辑</p>
            </div>
          </div>

          <label class="flex flex-col gap-1.5 max-w-xs">
            <span class="label-text font-medium">选择模板场景</span>
            <select v-model="activeTemplateScene" class="select select-bordered w-full">
              <option v-for="t in templateList" :key="t.scene" :value="t.scene">
                {{ getSceneLabel(t.scene) }}
              </option>
            </select>
          </label>

          <div class="divider my-0"></div>

          <div v-if="activeTemplate" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">模板名称</span>
                <input v-model="activeTemplate.name" class="input input-bordered w-full" />
              </label>
              <label class="flex flex-col gap-1.5">
                <span class="label-text font-medium">邮件主题</span>
                <input v-model="activeTemplate.subject" class="input input-bordered w-full" />
              </label>
            </div>

            <label class="flex flex-col gap-1.5">
              <span class="label-text font-medium">邮件内容</span>
              <textarea v-model="activeTemplate.content" class="textarea textarea-bordered w-full font-mono text-sm leading-tight" rows="8"></textarea>
            </label>

            <div class="flex items-center gap-3">
              <AppButton variant="primary" :loading="savingTemplate === activeTemplate.scene" @click="handleSaveTemplate(activeTemplate.scene)">保存模板</AppButton>
              <span v-if="templateMessages[activeTemplate.scene]" class="text-sm" :class="templateErrors[activeTemplate.scene] ? 'text-error' : 'text-success'">
                {{ templateMessages[activeTemplate.scene] }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </section>
  <ConfirmDialog ref="confirmRef" />
</template>

<script setup lang="ts">
import AppButton from "../../../components/AppButton.vue";
import SecretInput from "../../../components/SecretInput.vue";
import StatusTag from "../../../components/StatusTag.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import { normalizeTelefuncError } from "../../../lib/app-error";
import { reactive, ref, computed, useTemplateRef } from "vue";
import { useData } from "vike-vue/useData";
import { onSaveEmailConfig, onDeleteEmailConfig, onSaveEmailPushSettings, onActivateEmailProvider, onClearEmailLogs } from "./saveEmailConfig.telefunc";
import { onSaveEmailTemplate } from "./saveEmailTemplate.telefunc";
import { onSendTestEmail } from "./sendTestEmail.telefunc";
import type { Data } from "./+data";

type MailboxItem = {
  id?: number;
  name?: string;
  provider: "API" | "SMTP" | "CLOUDFLARE";
  isEnabled: boolean;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  // API fields
  apiProvider?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  secretKey?: string;
  timeoutMs?: number;
  // SMTP fields
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUsername?: string;
  smtpPassword?: string;
  // Cloudflare fields
  cloudflareBindingName?: string;
  cloudflareDestinationAddress?: string;
  cloudflareAllowedDestinationAddresses?: string[];
  // push flags
  customerSendOrderPaidEmail: boolean;
  customerSendDeliverySuccessEmail: boolean;
  customerSendDeliveryFailedEmail: boolean;
  adminSendOrderPaidEmail: boolean;
  adminSendDeliverySuccessEmail: boolean;
  adminSendDeliveryFailedEmail: boolean;
};

const { configs, templates, logs: initialLogs, metrics, pushSettings: initialPushSettings } = useData<Data>();

const activeTab = ref<"stats" | "config" | "list" | "template">("stats");
const confirmRef = useTemplateRef<InstanceType<typeof ConfirmDialog>>("confirmRef");

// ===================== Mailbox list =====================
const logList = reactive([...initialLogs]);

const mailboxList = reactive<MailboxItem[]>(
  Array.isArray(configs) ? configs.map((c: any) => ({ ...c })) : []
);

// ===================== Push settings =====================
const pushSettings = reactive({
  customerSendOrderPaidEmail: (initialPushSettings as any)?.customerSendOrderPaidEmail ?? false,
  customerSendDeliverySuccessEmail: (initialPushSettings as any)?.customerSendDeliverySuccessEmail ?? false,
  customerSendDeliveryFailedEmail: (initialPushSettings as any)?.customerSendDeliveryFailedEmail ?? false,
  adminSendOrderPaidEmail: (initialPushSettings as any)?.adminSendOrderPaidEmail ?? false,
  adminSendDeliverySuccessEmail: (initialPushSettings as any)?.adminSendDeliverySuccessEmail ?? false,
  adminSendDeliveryFailedEmail: (initialPushSettings as any)?.adminSendDeliveryFailedEmail ?? false,
});

const savingPushSettings = ref(false);
const pushSettingsMessage = ref("");
const pushSettingsError = ref(false);

// ===================== Template =====================
const templateList = reactive(templates.map((item: any) => ({ ...item })));
const activeTemplateScene = ref<"TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED">(templateList[0]?.scene || "TEST");
const activeTemplate = computed(() => {
  return templateList.find((t: any) => t.scene === activeTemplateScene.value) || templateList[0];
});
const savingTemplate = ref<"TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED" | "">("");
const templateMessages = reactive<Record<string, string>>({ TEST: "", ORDER_PAID: "", DELIVERY_SUCCESS: "", DELIVERY_FAILED: "" });
const templateErrors = reactive<Record<string, boolean>>({ TEST: false, ORDER_PAID: false, DELIVERY_SUCCESS: false, DELIVERY_FAILED: false });

// ===================== Config dialog =====================
const showConfigDialog = ref(false);
const editingId = ref<number | null>(null);
const savingConfig = ref(false);
const configDialogMessage = ref("");
const configDialogError = ref(false);

interface ConfigFormState {
  name: string;
  provider: "API" | "SMTP" | "CLOUDFLARE";
  fromEmail: string;
  fromName: string;
  replyTo: string;
  // API
  apiProvider: "BREVO" | "MAILJET";
  apiBaseUrl: string;
  apiKey: string;
  secretKey: string;
  timeoutMs: number;
  // SMTP
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  smtpAuthType: "plain" | "login" | "cram-md5";
  // Cloudflare
  cloudflareBindingName: string;
  cloudflareDestinationAddress: string;
  cloudflareAllowedText: string;
}

function createEmptyForm(): ConfigFormState {
  return {
    name: "",
    provider: "API",
    fromEmail: "",
    fromName: "",
    replyTo: "",
    apiProvider: "BREVO",
    apiBaseUrl: "https://api.brevo.com/v3/smtp/email",
    apiKey: "",
    secretKey: "",
    timeoutMs: 10000,
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: "",
    smtpPassword: "",
    smtpAuthType: "plain" as "plain" | "login" | "cram-md5",
    cloudflareBindingName: "",
    cloudflareDestinationAddress: "",
    cloudflareAllowedText: "",
  };
}

const configForm = reactive<ConfigFormState>(createEmptyForm());

function openCreateDialog() {
  editingId.value = null;
  Object.assign(configForm, createEmptyForm());
  configDialogMessage.value = "";
  configDialogError.value = false;
  showConfigDialog.value = true;
}

function openEditDialog(item: MailboxItem) {
  editingId.value = item.id ?? null;
  Object.assign(configForm, {
    name: item.name || "",
    provider: item.provider,
    fromEmail: item.fromEmail || "",
    fromName: item.fromName || "",
    replyTo: item.replyTo || "",
    apiProvider: (item as any).apiProvider || "BREVO",
    apiBaseUrl: (item as any).apiBaseUrl || "",
    apiKey: (item as any).apiKey || "",
    secretKey: (item as any).secretKey || "",
    timeoutMs: (item as any).timeoutMs || 10000,
    smtpHost: (item as any).smtpHost || "",
    smtpPort: (item as any).smtpPort || 587,
    smtpSecure: (item as any).smtpSecure || false,
    smtpUsername: (item as any).smtpUsername || "",
    smtpPassword: (item as any).smtpPassword || "",
    smtpAuthType: (item as any).smtpAuthType || "plain",
    cloudflareBindingName: (item as any).cloudflareBindingName || "",
    cloudflareDestinationAddress: (item as any).cloudflareDestinationAddress || "",
    cloudflareAllowedText: Array.isArray((item as any).cloudflareAllowedDestinationAddresses)
      ? (item as any).cloudflareAllowedDestinationAddresses.join("\n")
      : "",
  });
  configDialogMessage.value = "";
  configDialogError.value = false;
  showConfigDialog.value = true;
}

function closeConfigDialog() {
  showConfigDialog.value = false;
}

// ===================== Test modal =====================
const showTestModal = ref(false);
const testingMailboxId = ref<number | null>(null);
const testingMailboxName = ref("");
const testToEmail = ref("");
const testContent = ref("嘿！API 跑通了\n\n这是一封测试邮件。");
const isTesting = ref(false);
const testModalMessage = ref("");
const testModalError = ref(false);

function openTestModal(item: MailboxItem) {
  testingMailboxId.value = item.id ?? null;
  testingMailboxName.value = item.name || getChannelLabel(item.provider);
  testModalMessage.value = "";
  testModalError.value = false;
  showTestModal.value = true;
}

function closeTestModal() {
  showTestModal.value = false;
}

// ===================== Delete confirm =====================
const showDeleteConfirm = ref(false);
const deletingId = ref<number | null>(null);
const deletingMailboxName = ref("");
const deleting = ref(false);
const deleteMessage = ref("");

function handleDelete(item: MailboxItem) {
  if (item.isEnabled) return;
  deletingId.value = item.id ?? null;
  deletingMailboxName.value = item.name || getChannelLabel(item.provider);
  deleteMessage.value = "";
  showDeleteConfirm.value = true;
}

function closeDeleteConfirm() {
  showDeleteConfirm.value = false;
}

// ===================== Clear logs =====================
const showClearConfirm = ref(false);
const clearingLogs = ref(false);

async function handleClearLogs() {
  clearingLogs.value = true;
  try {
    await onClearEmailLogs();
    logList.splice(0);
    showClearConfirm.value = false;
  } catch (error) {
    await confirmRef.value?.alert({ title: "错误", message: normalizeTelefuncError(error, "清除失败") });
  } finally {
    clearingLogs.value = false;
  }
}

// ===================== Helpers =====================
function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}

function getSceneLabel(scene: string) {
  return ({ TEST: "测试邮件", ORDER_PAID: "支付成功", DELIVERY_SUCCESS: "发货成功", DELIVERY_FAILED: "发货失败" } as Record<string, string>)[scene] || scene;
}

function getChannelLabel(provider: string) {
  return ({ API: "API", SMTP: "SMTP", CLOUDFLARE: "CloudFlare" } as Record<string, string>)[provider] || provider;
}

// ===================== Actions =====================
async function handleSavePushSettings() {
  savingPushSettings.value = true;
  pushSettingsMessage.value = "";
  pushSettingsError.value = false;
  try {
    await onSaveEmailPushSettings({ ...pushSettings });
    pushSettingsMessage.value = "推送设置保存成功";
  } catch (error) {
    pushSettingsError.value = true;
    pushSettingsMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingPushSettings.value = false;
  }
}

async function handleSaveConfig() {
  savingConfig.value = true;
  configDialogMessage.value = "";
  configDialogError.value = false;

  try {
    const payload: Record<string, unknown> = {
      provider: configForm.provider,
      name: configForm.name,
      fromEmail: configForm.fromEmail,
      fromName: configForm.fromName,
      replyTo: configForm.replyTo,
      // always carry current push settings
      customerSendOrderPaidEmail: pushSettings.customerSendOrderPaidEmail,
      customerSendDeliverySuccessEmail: pushSettings.customerSendDeliverySuccessEmail,
      customerSendDeliveryFailedEmail: pushSettings.customerSendDeliveryFailedEmail,
      adminSendOrderPaidEmail: pushSettings.adminSendOrderPaidEmail,
      adminSendDeliverySuccessEmail: pushSettings.adminSendDeliverySuccessEmail,
      adminSendDeliveryFailedEmail: pushSettings.adminSendDeliveryFailedEmail,
    };

    if (editingId.value) {
      payload.id = editingId.value;
    }

    if (configForm.provider === "API") {
      payload.apiProvider = configForm.apiProvider;
      payload.apiBaseUrl = configForm.apiBaseUrl;
      payload.apiKey = configForm.apiKey;
      payload.secretKey = configForm.secretKey;
      payload.timeoutMs = configForm.timeoutMs;
    } else if (configForm.provider === "SMTP") {
      payload.smtpHost = configForm.smtpHost;
      payload.smtpPort = configForm.smtpPort;
      payload.smtpSecure = configForm.smtpSecure;
      payload.smtpUsername = configForm.smtpUsername;
      payload.smtpPassword = configForm.smtpPassword;
      payload.smtpAuthType = configForm.smtpAuthType;
    } else {
      payload.cloudflareBindingName = configForm.cloudflareBindingName;
      payload.cloudflareDestinationAddress = configForm.cloudflareDestinationAddress;
      payload.cloudflareAllowedDestinationAddresses = configForm.cloudflareAllowedText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const result = await onSaveEmailConfig(payload) as any;

    if (editingId.value) {
      // Update existing entry in list
      const idx = mailboxList.findIndex((m) => m.id === editingId.value);
      if (idx >= 0) {
        Object.assign(mailboxList[idx], result);
      }
    } else {
      // Add to list
      mailboxList.push({ ...result });
    }

    configDialogMessage.value = editingId.value ? "更新成功" : "创建成功";
    // Close dialog after short delay on success
    setTimeout(() => {
      showConfigDialog.value = false;
    }, 600);
  } catch (error) {
    configDialogError.value = true;
    configDialogMessage.value = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingConfig.value = false;
  }
}

async function handleActivate(item: MailboxItem) {
  if (!item.id || item.isEnabled) return;
  try {
    await onActivateEmailProvider(item.id);
    // Update all items in the list
    for (const m of mailboxList) {
      m.isEnabled = m.id === item.id;
    }
  } catch (error) {
    await confirmRef.value?.alert({ title: "错误", message: normalizeTelefuncError(error, "激活失败") });
  }
}

async function confirmDelete() {
  if (!deletingId.value) return;
  deleting.value = true;
  deleteMessage.value = "";
  try {
    await onDeleteEmailConfig(deletingId.value);
    const idx = mailboxList.findIndex((m) => m.id === deletingId.value);
    if (idx >= 0) {
      mailboxList.splice(idx, 1);
    }
    showDeleteConfirm.value = false;
  } catch (error) {
    deleteMessage.value = normalizeTelefuncError(error, "删除失败");
  } finally {
    deleting.value = false;
  }
}

async function handleSendTest() {
  if (!testingMailboxId.value) return;
  isTesting.value = true;
  testModalMessage.value = "";
  testModalError.value = false;

  try {
    await onSendTestEmail({
      toEmail: testToEmail.value,
      customContent: testContent.value,
      configId: testingMailboxId.value,
    });
    testModalMessage.value = "测试邮件发送成功";
  } catch (error) {
    testModalError.value = true;
    testModalMessage.value = normalizeTelefuncError(error, "测试发送失败");
  } finally {
    isTesting.value = false;
  }
}

async function handleSaveTemplate(scene: "TEST" | "ORDER_PAID" | "DELIVERY_SUCCESS" | "DELIVERY_FAILED") {
  savingTemplate.value = scene;
  templateMessages[scene] = "";
  templateErrors[scene] = false;

  try {
    const target = templateList.find((item: any) => item.scene === scene);
    if (!target) return;
    const result = await onSaveEmailTemplate({ ...target });
    Object.assign(target, result);
    templateMessages[scene] = "保存成功";
  } catch (error) {
    templateErrors[scene] = true;
    templateMessages[scene] = normalizeTelefuncError(error, "保存失败");
  } finally {
    savingTemplate.value = "";
  }
}
</script>