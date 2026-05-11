[![English](https://img.shields.io/badge/English-Click-yellow)](README-en.md)
[![中文文档](https://img.shields.io/badge/中文文档-点击查看-orange)](README.md)

# EdgeKey

EdgeKey 是一套有vike框架开发，可直接部署到 Cloudflare 的一体化全栈卡密商城系统：同一套代码同时包含前端页面、SSR 渲染、后端 API / 数据变更入口，并由 Cloudflare Workers 运行。

## 功能特性

- 🚀 **真正的零成本** — 不用购买服务器和域名，基于 Cloudflare 全球边缘网络运行。一键部署，即刻上线。把钱花在刀刃上，把时间还给自己。
- 🌍 **零成本运维** — 基于 Workers + D1，免费额度足够满足日常运营，无需担心额外的账单扣费。
- 🛍️ **商品管理** — 支持分类、商品上下架、库存模式（有限/无限）、最小/最大购买数量。
- 🔑 **卡密管理** — 批量导入卡密，支付后自动发货，支持库存实时预警。
- 📦 **订单管理** — 包含订单列表、手动补发、自动关闭过期订单及详细的支付日志。
- 💳 **多支付网关** — 内置 BEpusdt (USDT)、Epay (聚合支付)，支持插件式扩展更多接口。
- 📧 **邮件通知** — 支持 SMTP / API / Cloudflare Email 三种通道，内置详细的邮件发送日志。
- ⚙️ **站点设置** — 灵活配置站点名称、Logo、公告及客服联系方式。
- 🔐 **管理后台** — 安全可靠的管理员账号体系。

> [!TIP]
> **关于 0 成本运行：** 在配合支付渠道（usdt、自建等）、个人邮箱 SMTP 以及免费图床的理想状态下，本项目可实现 **100% 零成本** 运营。

## 技术文档
- [一键部署教程](./docs/fast_deploy/start.md)
- 支付：[BEpusdt](./docs/pay/bepusdt/start.md)、 [易支付](./docs/pay/epay/start.md) 、[支付宝](./docs/pay/alipay/start.md) 、[Stripe](./docs/pay/stripe/start.md)
- [更新日志](./CHANGELOG.md)

## 项目截图
![1](https://img.91starry.com/uploads/20260427/6286ff36cc987c47a1a27516db0d94c8.jpg)

![2](https://img.91starry.com/uploads/20260427/6072aac36a1d1db8b79cdb535d45138f.jpg)

![3](https://img.91starry.com/uploads/20260427/95dedb45c5d16d8cf69ffa058539b19d.jpg)

## 快速开始

本项目支持三种部署方式，按推荐程度排序：

| 方式 | 适合场景 | 便捷程度 |
|---|---|---|
| **一键部署**（推荐） | 首次部署，无需本地环境 | ⭐⭐⭐ 最简单，点击按钮全自动完成 |
| **Git 自动部署** | 持续迭代，代码推送自动更新 | ⭐⭐ 配置一次后全自动 |
| **手动部署** | 二开需求，细节掌控 | ⭐ 需要本地环境和命令行操作 |

详细步骤见下方各章节说明。

### 一键部署到 Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/34892002/edgeKey)

> **点击按钮后，会打开 Cloudflare Workers 部署向导，操作提示：**
> 1. 登录并授权 Git 账户(github、gitlab)，它会自动在你的git账号创建一个新仓库。
> 2. 为了增强安全性，请在向导中修改默认的密钥（ `AUTH_SECRET`）。
> 3. 如果你不绑定已有的D1数据库，它会自动完成新建数据库并初始化数据（管理员账号等）的操作，无需手动干预。
> 4. 部署成功之后在页面的日志里面可以找到 "Deployed edgekey triggers (0.38 sec) https://edgekey.你的账号.workers.dev" 这样的日志，其中 "https://edgekey.你的账号.workers.dev" 就是你的项目网址。
> 5. https://edgekey.你的账号.workers.dev/admin 为管理后台登陆地址，默认管理员账号:admin，密码:admin123456，切记登陆后立即修改密码！

**一键部署常见问题** 

如果 Cloudflare 提示【无法获取存储库内容】类似的异常信息，多半是很久之前绑定过github但授权状态过期或者异常，解绑后重新绑定授权即可。

一键部署与手动部署存在 wrangler.jsonc 文件的配置冲突，执行 `wrangler d1 ` 开头的命令需要配置 `database_id: 数据库id` ，填写[数据库ID](#如何获取数据库id)，否则会报错。受到影响的命令有 `npm run up` 和 `npm run db:` 开头的命令。

**一键部署后续更新方法**

a.首次更新
```base
git remote add upstream https://github.com/34892002/edgeKey.git
git fetch upstream
git merge upstream/main --allow-unrelated-histories
git push origin main
```

b.后续更新
```base
git fetch upstream
git merge upstream/main
git push origin main
```

> 在你的仓库执行上面的命令更新你的仓库到最新代码，最后git push origin main推送到你的仓库，cloudflare检测到就会自动触发部署

### 通过 Git 连接 Cloudflare 自动部署

如果你使用 Cloudflare Workers 的 Git 集成（连接 GitHub/GitLab 仓库自动部署），需要先完成以下前置步骤：

**0. 前置：在 Cloudflare Dashboard 创建 D1 数据库**

1. [创建数据库](#如何创建数据库) 名称填 `edgekey-db`
3. 记录[数据库id](#如何获取数据库id) `database_id` ，后续部署命令中需要用到

数据库表结构和种子数据会在首次部署时由 `deploy` 脚本自动完成初始化，无需手动操作。

**1. 部署命令**

由于 `wrangler.jsonc` 中的 `database_id` 需要与你的实际[D1 数据库](#如何获取数据库id)绑定，Git 自动部署时请在 Cloudflare 的"构建配置"中将部署命令设置为：

```bash
sed -i 's/"database_name": "edgekey-db"/"database_name": "edgekey-db", "database_id": "你的database_id"/' wrangler.jsonc && bun run deploy
```

**2. 配置 AUTH_SECRET 环境变量**

在 Cloudflare Workers Git 集成的"高级设置"中：
1. 添加变量名 `AUTH_SECRET`
2. 输入你的密钥字符串作为变量值
3. 勾选"加密"选项

### 构建与部署（手动）

首次部署到 Cloudflare 前，需要先在云端创建并初始化 D1 数据库：

1. **登录并创建数据库**
   ```bash
   bunx wrangler login
   bunx wrangler d1 create edgekey-db
   ```

2. **绑定 Database ID**
   将上一步终端输出的 `database_id` 填入 `wrangler.jsonc`。

```jsonc
"d1_databases": [
	{
		"binding": "DB",
		"database_name": "edgekey-db",
		"database_id": "这里填入你刚创建数据库的UUID", // <-- 必须添加这一行
		"migrations_dir": "prisma/migrations"
	}
]
```

3. **按顺序初始化云端表结构**
   ```bash
   bun run db:migrations:remote
   ```

4. **初始化管理员账号与初始化种子数据**
   ```bash
   bun run db:seed:remote
   ```

5. **配置 AUTH_SECRET**
  输入命令执行，根据命令行提示输入你要使用的密钥字符串。```bash
   bunx wrangler secret put AUTH_SECRET
   ```

6. **生成 Prisma Client 并一键部署**
   ```bash
   bun run db:generate
   bun run up
   ```

`bun run up` 等价于先构建再发布：
- `vike build`
- `wrangler deploy`

部署配置见 `wrangler.jsonc`（其中 `main` 指向 Photon 的 Cloudflare server-entry 虚拟入口）。

## 安全性说明（重要）

当前项目使用管理员账号密码登录。用于生产环境前请务必：
- Cloudflare 生产环境必须配置 `AUTH_SECRET`，未配置会抛出异常并禁止管理员登录
- 配置方式详见上方"一键部署"、"通过 Git 连接 Cloudflare 自动部署"、"构建与部署（手动）"各章节说明
- 生产环境配置AUTH_SECRET命令 `wrangler secret put AUTH_SECRET`
- 默认管理员账号为 `admin / admin123456`，首次登录后请立即修改密码

### 忘记密码？

在 Cloudflare Dashboard 中通过 D1 Console 将密码重置为 `admin123456`：
执行以下 SQL [如何执行sql](#如何执行sql)：

```sql
UPDATE Admin SET passwordHash = '$2b$10$viMe8RgcpM30gmmF9OpOcuA/QgleSIUk5VRtqjOulfSIbgK5jQCI6' WHERE username = 'admin';
```

4. 登录后台后立即修改密码

## 本地开发

推荐使用 Bun（也可替换为 npm/pnpm/yarn）。

```bash
bun install
```

由于本项目使用了 Cloudflare D1 数据库，在首次启动本地开发服务器前，必须先初始化本地的 D1 模拟器表结构：

```bash
# 1. 生成 Prisma Client（首次安装依赖后必须执行）
bun run db:generate

# 2. 按顺序将所有迁移脚本应用到本地 Wrangler 模拟器
bun run db:migrations:local

# 3. 初始化管理员账号与初始化种子数据
bun run db:seed

# 4. 准备.env 文件
# 请在 `env.example` 中填写必要的环境变量，例如 `AUTH_SECRET`。
# 然后复制 `env.example` 到 `env` 文件。

# 5. 启动开发服务器
bun run dev
```
## Cloudflare平台操作

### 如何创建数据库

1. 进入 [dash.cloudflare.com](https://dash.cloudflare.com) → **存储和数据库** → **D1 数据库**
2. 页面右侧点击 **创建数据库** 进入创建 D1 数据库页面
3. **名称**填写数据库名称，**数据位置**没有特殊需求一般选择 自动...最近的可用区域

#### 如何获取数据库ID

1. 进入 [dash.cloudflare.com](https://dash.cloudflare.com) → **存储和数据库** → **D1 数据库**
2. 页面右侧会展示你创建的所有数据库
3. 找到你要操作的数据库名称 比如`edgekey-db` 点击对应的`UUID`即可复制id

### 如何执行SQL

1. 进入 [dash.cloudflare.com](https://dash.cloudflare.com) → **存储和数据库** → **D1 数据库**
2. 页面右侧会展示你创建的所有数据库，点击你要操作的数据库名称 比如 `edgekey-db`
3. 点击顶部标签 → **控制台**

### Cloudflare D1 + Prisma 本地开发工作流

本项目使用了 Prisma ORM 与 Cloudflare D1 数据库，完全遵循 [官方 Prisma + Cloudflare D1 指南](https://www.prisma.io/docs/guides/deployment/cloudflare-d1) 的最佳实践。

### 当前运行方式

- `bun dev` 运行在 Cloudflare 风格的本地开发环境中，Prisma 会通过 `env.DB` 连接到**本地 D1 模拟器**。
- `bun run up` 部署后，Prisma 会通过同一个 `env.DB` 绑定连接到**远程 D1**。
- `.env` 中的 `DATABASE_URL` 仅用于 Prisma CLI / 配置层，不参与当前应用运行时的数据库连接。
- 当前 `prisma/schema.prisma` 仅保留 Cloudflare client generator，运行时统一使用 `generated/prisma/client`。
- 因此，本项目当前的数据库运行模式是：**开发环境用本地 D1，生产环境用远程 D1**。

### 正确的数据库开发工作流

当你需要修改数据库表结构时，请**严格按照以下流程执行**：

**第一步：修改 Schema 并生成 SQL 迁移脚本**

修改 `prisma/schema.prisma` 后，不要使用常规的 `migrate dev`，而是使用 `migrate diff` 生成 SQL 脚本：

```bash
# 由于 Cloudflare D1 和普通的 MySQL 完全不同。普通的 Prisma migrate dev 依赖于一个长期运行的数据库连接来比对状态、创建 shadow database 等等，而 D1 不支持这些操作。
# 后续增量迁移（修改现有表结构时）
# 新版 Prisma 已经废弃了 --from-local-d1，推荐使用 --from-migrations
bunx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/0002_xxx.sql
```

说明：
- `0001_init.sql` 只用于第一次初始化，不应在后续迁移中反复覆盖。
- 后续迁移请按顺序新增文件，例如 `0002_add_foo.sql`、`0003_add_bar.sql`。

**第二步：将迁移同步到本地 D1 模拟器（用于本地开发/测试）**

```bash
bun run db:migrations:local
```

如果不执行这一步，运行 `bun dev` 访问页面时会报错 `no such table`。

**第三步：将迁移同步到 Cloudflare 线上（发布前）**

```bash
bun run db:migrations:remote
```

本地和线上需要分别执行一次。

### 日常开发命令

```bash
bun dev
```

上面的命令会启动本地开发服务器，并使用 `wrangler.jsonc` 中定义的 D1 绑定连接到**本地 D1 模拟器**。

### Telefunc 说明

- Telefunc 函数按约定放在对应页面目录下，以 `.telefunc.ts` 结尾。
- 当前 Windows + `bun dev` + `workerd` 组合下，Telefunc 的开发态命名/同目录检查会触发路径兼容问题，因此在 `server/telefunc-handler.ts` 中关闭了该检查。
- 这不会影响 Telefunc 的实际加载和调用，只是跳过开发态的命名约定校验。

**⚠️ 绝对不要做的操作：**
1. **不要**假设 `bun dev` 使用的是 `prisma/db.sqlite`；当前它实际使用的是本地 D1 模拟器。
2. **不要**使用 `prisma migrate dev`，这会偏离当前 D1 迁移工作流。
3. **不要**反复覆盖 `prisma/migrations/0001_init.sql`；初始化迁移和后续增量迁移应分开维护。
4. **不要**信任 Prisma 生成的迁移 SQL，必须手动核查脚本，重点识别并拦截非预期的 **DROP TABLE** 或**全量重建**逻辑，确保迁移过程为增量更新且不覆盖存量数据。

## 技术栈

- 框架与渲染
  - Vike（文件路由 + SSR）
  - Vue 3（前端组件）
- Server / 运行时
  - Hono（服务端路由与中间件）
  - Photon（将服务端入口适配到 Cloudflare）
  - Wrangler（Cloudflare 部署与本地开发工具）
- 数据与变更
  - Telefunc（前后端同构的数据变更 RPC）
  - Prisma（ORM）
  - D1（Cloudflare 原生 SQLite 数据库，本项目开发与部署统一使用）
- UI
  - Tailwind CSS
  - daisyUI（Tailwind 组件与主题）
- 认证
  - Auth.js（管理员账号密码登录）

## 项目结构

```
.
├─ assets/                 # 静态资源
├─ components/             # 复用组件（非路由页面）
├─ pages/                  # Vike 文件路由目录（页面就近放置组件/样式/类型）
│  ├─ +config.ts           # 全局配置（例如 title、SSR 等）
│  ├─ +Layout.vue          # 全局布局
│  ├─ +Head.vue            # 全局 head 标签
│  ├─ tailwind.css         # Tailwind + daisyUI 入口
│  ├─ index/+Page.vue      # 前台首页（/）
│  ├─ product/+Page.vue    # 商品详情页（/product/:slug）
│  ├─ query/+Page.vue      # 订单查询页（/query）
│  ├─ order/+Page.vue      # 订单详情页（/order/:orderNo）
│  ├─ admin/               # 管理后台（/admin）
│  └─ _error/+Page.vue     # 错误页
├─ server/                 # 服务端入口（Hono）与中间件
│  ├─ entry.ts             # 服务端主入口
│  ├─ authjs-handler.ts    # Auth.js handler + session middleware
│  ├─ prisma-middleware.ts # Prisma D1 注入中间件
│  └─ telefunc-handler.ts  # Telefunc handler
├─ lib/                    # 业务逻辑库（支付适配器、发货逻辑等）
├─ modules/                # 功能模块（支付通知、订单等）
├─ scripts/                # 辅助脚本（种子数据、验证脚本）
├─ prisma/                 # Prisma Schema 与迁移 SQL
│  ├─ schema.prisma
│  └─ migrations/
│     ├─ 0001_init.sql
│     └─ 0002_xxx.sql
├─ vite.config.ts          # Vite 插件配置（vike + vue + tailwind + telefunc）
├─ wrangler.jsonc          # Cloudflare Workers 配置（入口为 Photon 虚拟模块）
└─ package.json            # 脚本与依赖
```

### 关于 `+` 文件（Vike 约定）

`pages/` 目录下以 `+` 开头的文件是 Vike 的"约定接口文件"，用于声明页面、配置与数据加载等；不带 `+` 的文件会被当作普通模块（组件、样式、类型）处理，便于页面就近组织代码。

常见 `+` 文件：
- `+Page.vue`：页面组件
- `+data.ts`：页面数据获取（SSR/CSR 共享）
- `+Layout.vue`：布局（包裹页面）
- `+Head.vue`：head 标签
- `+config.ts`：页面/全局配置

## 代码规范

### TypeScript 类型引用规范

所有类型引用**必须在文件顶部使用 `import type` 导入**，禁止在变量声明、函数参数、泛型等位置使用内联 `import()` 写法。
```typescript
// bad：禁止内联引用
function handle(data: import("./types").SomeType) { ... }
// good：顶部统一导入
import type { SomeType } from "./types";
function handle(data: SomeType) { ... }
```


## 日志排查

当邮件发送异常或支付回调出现问题时，可在 Cloudflare Dashboard 查看 Workers 运行日志：

> 实时线上环境日志: bunx wrangler tail --format pretty

1. 进入 [dash.cloudflare.com](https://dash.cloudflare.com)
2. 左侧菜单 → **Workers & Pages** → 点击 **edgekey**
3. 顶部 tab → **Observability**
4. 在搜索框输入关键词过滤日志，例如：
   - `email.notify_order_paid.config_failed` — 支付后邮件配置获取失败
   - `email.send.failed` — 邮件发送失败
   - `email.order_paid.failed` — 支付成功后发送邮件通知失败
   - `payment.notify.route_exception` — 支付回调路由异常
   - `payment.notify.context_missing` — 支付回调缺少数据库上下文
   - `payment.notify.diagnostic` — 支付回调校验异常诊断（签名错误、金额不匹配等）
   - `bepusdt.verify_notify` — BEpusdt 回调原始 payload（info 级别）

## 鸣谢

感谢 [Linux.do](https://linux.do/) 、[NodeSeek](https://www.nodeseek.com/) 社区支持。

感谢下列开源项目
- [Ebpusdt](https://github.com/v03413/BEpusdt) — 加密货币交易支持
- [worker-mailer](https://github.com/zou-yu/worker-mailer) — Workers环境SMTP邮件支持


## 🏝️ 社区交流
- Telegram 群组：https://t.me/edgeKeyChannel
- Telegram 频道：https://t.me/edgeKeyGroup
