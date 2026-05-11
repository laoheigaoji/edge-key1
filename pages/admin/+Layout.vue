<template>
  <slot v-if="isLoginPage" />

  <div v-else-if="needsLogin" class="flex min-h-screen items-center justify-center bg-base-200 px-4">
    <section class="card w-full max-w-md bg-base-100 shadow-sm">
      <div class="card-body space-y-4 text-center">
        <h1 class="text-2xl font-bold">需要管理员登录</h1>
        <p class="text-sm text-base-content/70">正在跳转到后台登录页，如果没有自动跳转，请手动点击下面按钮。</p>
        <AppButton variant="primary" :href="`/admin/login?redirect=${encodeURIComponent(currentPath)}`">前往登录</AppButton>
      </div>
    </section>
  </div>

  <div v-else class="drawer lg:drawer-open min-h-screen bg-base-200">
    <input id="admin-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col min-w-0">
      <!-- 移动端 Navbar -->
      <div class="navbar bg-base-100 border-b border-base-300 w-full lg:hidden sticky top-0 z-40 shadow-sm">
        <div class="flex-none">
          <label for="admin-drawer" aria-label="open sidebar" class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </label>
        </div>
        <div class="flex-1 px-2 mx-2">
          <h1 class="text-lg font-bold text-primary">edgeKey</h1>
        </div>
      </div>

      <!-- PC端 Header -->
      <header class="hidden lg:flex items-center justify-between border-b border-base-300 bg-base-100 px-8 py-4 sticky top-0 z-30 shadow-sm">
        <div>
          <div class="breadcrumbs text-sm text-base-content/60 mt-0.5">
            <ul>
              <li><a href="/admin">Home</a></li>
              <li v-if="breadcrumbs?.length > 0"><a :href="breadcrumbs[0].href">{{ breadcrumbs[0].name }}</a>
              </li>
              <li v-if="breadcrumbs?.length > 1">{{ breadcrumbs[1].name }}</li>
            </ul>
          </div>
        </div>

        <ul class="menu menu-horizontal bg-base-200 rounded-box p-1 gap-1">
          <li class="tooltip tooltip-bottom z-50" data-tip="语言: 中文">
            <a>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            </a>
          </li>
          <li class="tooltip tooltip-bottom z-50" data-tip="切换主题">
            <label class="swap swap-rotate px-3 py-2">
              <!-- this hidden checkbox controls the state -->
              <input type="checkbox" class="theme-controller" value="dark" />
              <!-- sun icon -->
              <svg class="swap-off h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" /></svg>
              <!-- moon icon -->
              <svg class="swap-on h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" /></svg>
            </label>
          </li>
          <li class="tooltip tooltip-bottom z-50" data-tip="返回前台">
            <a href="/">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </a>
          </li>
        </ul>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-4 lg:p-8">
        <div class="mx-auto max-w-7xl w-full">
          <slot />
        </div>
      </main>
    </div>

    <div class="drawer-side z-50">
      <label for="admin-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <aside class="bg-base-100 min-h-screen w-72 flex flex-col border-r border-base-300 shadow-sm">
        <!-- Logo Area -->
        <a
          href="/admin"
          class="p-6 pb-2 flex items-center gap-2 hover:bg-base-200 transition-colors block"
        >
          <img :src="siteLogo" height="50" width="50" alt="logo" />
          <div>
            <div class="text-2xl font-black text-primary tracking-tight">EK Admin</div>
            <p class="text-xs font-medium text-base-content/50 mt-1 uppercase tracking-wider">
              全球部署，一触即达。
            </p>
          </div>
        </a>

        <!-- Navigation -->
        <div class="p-4 flex-1 overflow-y-auto">
          <ul class="menu menu-md w-full gap-1 p-0">
            <li><a href="/admin" :class="{'active': currentPath === '/admin'}">仪表盘</a></li>
            <li><a href="/admin/categories" :class="{'active': currentPath?.startsWith('/admin/categories')}">分类管理</a></li>
            <li><a href="/admin/products" :class="{'active': currentPath?.startsWith('/admin/products')}">商品管理</a></li>
            <li><a href="/admin/cards" :class="{'active': currentPath?.startsWith('/admin/cards')}">卡密管理</a></li>
            <li><a href="/admin/orders" :class="{'active': currentPath?.startsWith('/admin/orders')}">订单管理</a></li>
            <li><a href="/admin/payments" :class="{'active': currentPath?.startsWith('/admin/payments')}">支付配置</a></li>
            <li><a href="/admin/email" :class="{'active': currentPath?.startsWith('/admin/email')}">邮件管理</a></li>
            <li><a href="/admin/media" :class="{'active': currentPath?.startsWith('/admin/media')}">文件管理</a></li>
            <li><a href="/admin/settings" :class="{'active': currentPath?.startsWith('/admin/settings')}">站点设置</a></li>
            <!-- <li><a href="/admin/security" :class="{'active': currentPath?.startsWith('/admin/security')}">安全配置</a></li> -->
            <li><a href="/admin/profile" :class="{'active': currentPath?.startsWith('/admin/profile')}">个人资料</a></li>
          </ul>
        </div>

        <!-- Footer Area -->
        <div class="p-4 border-t border-base-300 mt-auto space-y-2">
          <AppButton variant="outline" block @click="handleSignOut">退出登录</AppButton>
          <div class="flex items-center justify-between text-xs text-base-content/50 px-2">
            <a class="cursor-default" target="_blank" href="https://github.com/34892002/edgeKey">edgeKey</a>
            <div class="">
              <button class="hover:text-primary transition-colors mr-2" @click="checkUpdate" :title="updateTip" >
                v{{ appVersion }}-{{ gitHash }}
              </button>
              <div class="inline-grid *:[grid-area:1/1]">
                <div class="animate-ping status" :class="statusColor"></div>
                <div class="status" :class="statusColor"></div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import AppButton from "../../components/AppButton.vue";
import { usePageContext } from "vike-vue/usePageContext";

import logoUrl from "../../assets/logo.svg";

const pageContext = usePageContext();

const currentPath = computed(() => pageContext.urlPathname ?? "");
const gitHash = __GIT_HASH__;
const appVersion = __APP_VERSION__;

const statusColor = ref('status-success');
const updateTip = ref('点击检查更新');
const lastCheckTime = ref(0);
const COOLDOWN_MS = 10 * 60 * 1000;

async function checkUpdate() {
  const now = Date.now();
  if (now - lastCheckTime.value < COOLDOWN_MS) {
    // const remaining = Math.ceil((COOLDOWN_MS - (now - lastCheckTime.value)) / 60000);
    updateTip.value = '请勿频繁查询';
    return;
  }
  lastCheckTime.value = now;
  statusColor.value = 'status-warning';
  updateTip.value = '检查中...';
  try {
    const pkgRes = await fetch('https://raw.githubusercontent.com/34892002/edgeKey/main/package.json');
    const pkg = await pkgRes.json() as { version?: string };
    if (!pkg.version) throw new Error('invalid response');
    
    // 这里只比较 package.json 中的纯版本号，不参与 git hash 展示串。
    const isLatest = compareVersions(appVersion, pkg.version) >= 0;
    
    statusColor.value = isLatest ? 'status-success' : 'status-error';
    updateTip.value = isLatest ? `已是最新版本` : `有新版本 v${pkg.version}`;
  } catch {
    statusColor.value = 'status-error';
    updateTip.value = '检查失败，请稍后重试';
  }
}

// 比较 package.json 的纯版本号，例如 1.2.1 与 1.2.2。
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

async function handleSignOut() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/signout";
  const csrf = document.createElement("input");
  csrf.type = "hidden";
  csrf.name = "csrfToken";
  const token = await fetch("/api/auth/csrf").then(r => r.json()).then((d: any) => d.csrfToken);
  csrf.value = token;
  form.appendChild(csrf);
  document.body.appendChild(form);
  form.submit();
}
const isLoginPage = computed(() => (pageContext.urlPathname ?? "") === "/admin/login");
const isAdminUser = computed(() => pageContext.session?.user?.role === "admin");
const needsLogin = computed(() => !isLoginPage.value && !isAdminUser.value);
const siteLogo = computed(() => pageContext.site?.logo || logoUrl);

type Crumb = { name: string; href?: string };

const BREADCRUMB_ROUTES: { pattern: string; crumbs: Crumb[] }[] = [
  { pattern: "/admin/products/new",      crumbs: [{ name: "商品管理", href: "/admin/products" }, { name: "新建商品" }] },
  { pattern: "/admin/products/:id/edit", crumbs: [{ name: "商品管理", href: "/admin/products" }, { name: "编辑商品" }] },
  { pattern: "/admin/products",          crumbs: [{ name: "商品管理" }] },
  { pattern: "/admin/orders/:id",        crumbs: [{ name: "订单管理", href: "/admin/orders" }, { name: "订单详情" }] },
  { pattern: "/admin/orders",            crumbs: [{ name: "订单管理" }] },
  { pattern: "/admin/categories",        crumbs: [{ name: "分类管理" }] },
  { pattern: "/admin/cards",             crumbs: [{ name: "卡密管理" }] },
  { pattern: "/admin/payments",          crumbs: [{ name: "支付配置" }] },
  { pattern: "/admin/email",             crumbs: [{ name: "邮件管理" }] },
  { pattern: "/admin/media",             crumbs: [{ name: "文件管理" }] },
  { pattern: "/admin/settings",          crumbs: [{ name: "站点设置" }] },
  { pattern: "/admin/security",          crumbs: [{ name: "安全配置" }] },
  { pattern: "/admin/profile",           crumbs: [{ name: "个人资料" }] },
];

function matchRoute(pattern: string, path: string) {
  const re = new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+") + "(/.*)?$");
  return re.test(path);
}

const breadcrumbs = computed((): Crumb[] => {
  const path = currentPath.value ?? "";
  const route = BREADCRUMB_ROUTES.find(r => matchRoute(r.pattern, path));
  return route ? route.crumbs : [];
});

onMounted(() => {
  if (needsLogin.value) {
    window.location.href = `/admin/login?redirect=${encodeURIComponent(currentPath.value)}`;
  }
});
</script>
