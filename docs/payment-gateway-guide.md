# 支付网关开发指南

## 运行环境约束

本项目部署在 **Cloudflare Workers**，接入新支付网关时必须注意：

- **禁止**引入依赖 `node:fs`、`node:path` 的第三方 SDK（如官方 `alipay-sdk`）
- **签名实现**统一使用 Web Crypto API（`crypto.subtle`），零依赖，完全兼容 Workers
- **脚本体积**：免费版限制 1MB，引入任何新依赖前先评估打包体积

## 适配器接口

所有支付网关必须实现 `PaymentProviderAdapter`（`modules/payment/provider.ts`）：

- `createPayment(input)`：生成支付跳转 URL，返回 `{ payUrl, paymentOrderNo?, raw? }`
- `verifyNotify(payload)`：验证异步回调签名，返回订单号、金额、支付状态

## 新增支付网关步骤

1. `modules/payment/types.ts` — `PaymentProvider` 联合类型加新值，`PaymentConfigValue` 加专用字段
2. `modules/payment/xxx.ts` — 实现适配器，导出 `createXxxAdapter(config)`
3. `modules/payment/service.ts` — `defaultPaymentConfigs` 加默认配置，`createProviderAdapter` 加分支，`savePaymentConfig` 保存专用字段
4. `server/routes/payment-xxx.ts` — 注册 `/api/payments/xxx/notify` 路由
5. `server/routes/index.ts` — 调用 `registerXxxRoutes`
6. `pages/admin/payments/forms/XxxForm.vue` — 新建专用字段表单组件
7. `pages/admin/payments/PaymentConfigCard.vue` — `formMap` 加新组件，`extraFields` 初始化加新分支
8. `pages/admin/payments/+Page.vue` — 加 tab
9. `pages/admin/payments/savePaymentConfig.telefunc.ts` — 加专用字段参数

> **无需数据库迁移**：`PaymentConfig.provider` 字段为 `TEXT`，SQLite 不强制 enum 约束，直接存新值即可。

## BEpusdt 接口说明

BEpusdt 是一款个人加密货币收款网关，支持 USDT、USDC、TRX 等多种币种。

### 工作模式

本项目使用**收银台模式**（`/api/v1/order/create-order`），用户在 BEpusdt 收银台页面自由选择支付链，无需在代码中指定 `trade_type`。

| 模式 | 接口 | 说明 |
|------|------|------|
| 收银台模式 | `/api/v1/order/create-order` | 不锁定支付方式，用户在收银台选择 |
| 直接锁定模式 | `/api/v1/order/create-transaction` | 指定 `trade_type` 直接锁定支付链 |

### 配置项

| 字段 | 说明 |
|------|------|
| `baseUrl` | BEpusdt 服务域名，如 `https://bep.example.com`（只填域名，代码自动拼接 API 路径） |
| `appSecret` | 后台「系统管理 → 基本设置 → API 设置 → 对接令牌」 |

### 签名算法

1. 筛选所有**非空**且**非 `signature`** 的参数
2. 按参数名 **ASCII 升序**排列，拼接为 `key=value&key=value`
3. 末尾追加 `appSecret`（无 `&`）
4. 对完整字符串做 **MD5**，结果转小写即为 `signature`

### 回调说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `order_id` | string | 商户订单号 |
| `trade_id` | string | BEpusdt 交易 ID |
| `amount` | number | 法币金额（CNY） |
| `actual_amount` | number | 实际支付加密货币金额 |
| `status` | number | `1`=待支付 `2`=成功 `3`=超时 |
| `signature` | string | 签名 |

回调响应要求返回字符串 `success`（不区分大小写），否则 BEpusdt 会按退避策略重试。

### 钱包配置

在 BEpusdt 后台「钱包管理」中添加收款地址，交易类型格式为 `{币种}.{网络}`，例如：

| 交易类型 | 说明 |
|----------|------|
| `usdt.trc20` | USDT on Tron |
| `usdt.bep20` | USDT on BSC |
| `usdt.polygon` | USDT on Polygon |
| `usdc.polygon` | USDC on Polygon |
| `tron.trx` | TRX on Tron |

> **注意**：收银台模式（`/create-order`）目前仅显示 USDT 支付方式，USDC 等其他币种需等待 BEpusdt 官方修复。已向官方提交 Issue。

官方文档：https://github.com/v03413/BEpusdt/blob/main/docs/api/api.md

## 支付宝接口说明

| 场景 | 接口名 | 唤起方式 |
|------|--------|----------|
| PC 网站 | `alipay.trade.page.pay` | 表单 POST 跳转 |
| H5 手机 | `alipay.trade.wap.pay` | 表单 POST 跳转（唤起 App） |

通过订单的 `paymentChannel` 字段区分：`pc` → `alipay.trade.page.pay`，其他 → `alipay.trade.wap.pay`。

### 签名流程（RSA2-SHA256）

**发起支付（请求签名）**：
1. 构造业务参数对象 `biz_content`
2. 拼接公共参数（`app_id`、`method`、`charset`、`sign_type`、`timestamp`、`version`、`biz_content`）
3. 按参数名 ASCII 升序排列，拼接为 `key=value&key=value` 字符串
4. 用**应用私钥**（PKCS#8）对字符串做 RSA2-SHA256 签名，Base64 编码为 `sign`
5. 将所有参数（含 `sign`）拼接为表单，POST 到支付宝网关

**回调验证（验签）**：
1. 从回调参数中提取 `sign`，移除 `sign` 和 `sign_type`
2. 剩余参数按 ASCII 升序排列拼接
3. 用**支付宝公钥**验证签名

### 配置项

| 字段 | 说明 |
|------|------|
| `alipayAppId` | 支付宝开放平台应用 ID |
| `alipayPrivateKey` | 应用私钥（PKCS#8 格式，去掉 PEM 头尾和换行） |
| `alipayPublicKey` | 支付宝公钥（用于验签，去掉 PEM 头尾和换行） |

官方文档：
- PC 支付：https://opendocs.alipay.com/open/270/105898
- H5 支付：https://opendocs.alipay.com/open/203/107090
- 密钥工具：https://opendocs.alipay.com/common/02kipl

## Stripe 接口说明

Stripe 是国际主流信用卡收款网关，本项目使用 **Checkout Session** 模式，用户跳转到 Stripe 托管收银台完成支付。

### 工作模式

创建 Checkout Session 后跳转到 Stripe 收银台，支付完成后通过 Webhook 异步通知。

| 接口 | 说明 |
|------|------|
| `POST /v1/checkout/sessions` | 创建支付会话，返回 `url` 跳转地址 |
| Webhook `checkout.session.completed` | 支付成功异步回调 |

### 配置项

| 字段 | 说明 |
|------|------|
| `stripeSecretKey` | Stripe Dashboard → Developers → API keys → Secret key（`sk_live_...`） |
| `stripeWebhookSecret` | Stripe Dashboard → Developers → Webhooks → 端点签名密钥（`whsec_...`） |
| `stripeCurrency` | ISO 4217 货币代码，如 `cny`、`usd`、`hkd`，默认 `cny` |

> **注意**：Stripe 要求订单金额折算成 USD 至少 $0.50（部分货币更高）。CNY 最低约 ¥4，低于此金额会报错。

### Webhook 配置

在 Stripe Dashboard → Developers → Webhooks 创建端点：
- **URL**：`https://你的域名/api/payments/stripe/notify`
- **监听事件**：`checkout.session.completed`

### 签名验证（HMAC-SHA256）

1. 读取请求原始 body（不可解析后重新序列化）
2. 从 `Stripe-Signature` 请求头解析 `t`（时间戳）和 `v1`（签名）
3. 拼接签名字符串：`{t}.{rawBody}`
4. 用 `webhookSecret` 对拼接字符串做 HMAC-SHA256，结果转十六进制
5. 与 `v1` 比对，一致则验签通过

### 回调说明

回调为 JSON 格式，路由读取原始 body 后以 `__raw_body` 和 `__stripe_signature` 传入适配器。

| 字段 | 说明 |
|------|------|
| `type` | 事件类型，仅处理 `checkout.session.completed` |
| `data.object.id` | Stripe Session ID，作为 `paymentOrderNo` |
| `data.object.metadata.orderNo` | 商户订单号 |
| `data.object.amount_total` | 实际支付金额（单位：分） |

回调响应返回 `success` 字符串即可。

官方文档：
- Checkout：https://stripe.com/docs/payments/checkout
- Webhook：https://stripe.com/docs/webhooks
- API 密钥：https://dashboard.stripe.com/apikeys