# 定时任务：自动关闭过期未支付订单

## 概述

EdgeKey 使用 Cloudflare Workers Cron Trigger 定时扫描超时未支付的订单并自动关闭，释放库存。

- **执行频率**：每 5 分钟一次（`*/5 * * * *`）
- **过期时间**：订单创建后 30 分钟未支付即关闭（当前硬编码）
- **配置位置**：`wrangler.jsonc` → `triggers.crons`

## 工作原理

```
┌─────────────┐     每 5 分钟      ┌──────────────────┐
│ Cloudflare   │ ──────────────────→│  scheduled()     │
│ Cron Trigger │                    │  server/scheduled.ts
└─────────────┘                    └───────┬──────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ autoCloseExpiredOrders()
                                  │ modules/order/service.ts
                                  └───────┬──────────┘
                                          │
                              ┌───────────┼───────────┐
                              ▼           ▼           ▼
                         查询过期订单  批量关闭订单  写入 PaymentLog
```

### 处理逻辑

1. **查询**：找出所有 `status = PENDING`、`paymentStatus = UNPAID`、`createdAt < (now - 30分钟)` 的订单
2. **关闭**：将这些订单的 `status` 更新为 `CLOSED`，设置 `closedAt`
3. **日志**：为每个被关闭的订单写入一条 PaymentLog（`eventType = AUTO_CLOSE`）
4. **批量**：单次最多处理 100 条，避免 D1 查询过大

### 不修改 paymentStatus

auto-close 只修改 `status` 和 `closedAt`，**不修改 `paymentStatus`**（保持 `UNPAID`）。这是一个有意的设计决策：

- 支付回调的 `updateOrderPayment` 使用 `WHERE paymentStatus = "UNPAID"` 做乐观锁
- 如果 auto-close 把 `paymentStatus` 改成 `FAILED`，延迟到达的支付回调会更新失败 → 买家付了钱但订单被关了，**造成资损**
- 保持 `paymentStatus = UNPAID` 允许延迟回调正常处理，订单会被重新打开为 `PAID`

## 竞态场景说明

### 正常超时（最常见）

```
T=0min   买家创建订单
T=30min  auto-close 关闭订单 → PaymentLog: eventType=AUTO_CLOSE
T=∞      买家未支付，订单永久关闭
```

### 竞态：支付回调在 auto-close 之后到达（极少见）

```
T=0min   买家创建订单
T=29min  买家付款（支付网关处理延迟）
T=30min  auto-close 关闭订单 → PaymentLog: eventType=AUTO_CLOSE
T=31min  支付回调到达 → updateOrderPayment 成功（paymentStatus 仍为 UNPAID）
         → 订单被重新打开为 PAID → 正常发货
         → PaymentLog: eventType=NOTIFY, message="ok (reopened from CLOSED)"
```

这种情况下买家体验不受影响，订单会正常完成。管理后台的支付日志中可以看到 `"(reopened from CLOSED)"` 标记。

## 文件改动说明

### `modules/order/service.ts`

新增 `autoCloseExpiredOrders(prisma)` 函数，包含核心业务逻辑。

### `modules/payment/service.ts`

在 `handlePaymentNotify` 中，当支付成功且订单之前处于 `CLOSED` 状态时，在 PaymentLog 的 message 中追加 `"(reopened from CLOSED)"` 标记。

### `server/scheduled.ts`（新建）

Cloudflare Workers `scheduled` handler，负责：
- 从 `env.DB` 获取 D1 绑定
- 创建 Prisma 客户端
- 调用 `autoCloseExpiredOrders()`

### `server/entry.ts`

在 `serve()` 返回的对象上挂载 `scheduled`，使其通过 Photon 虚拟模块的 spread 传递到最终的 default export 上：

```ts
import { scheduled } from "./scheduled";

const entry = serve(createApp(), { port }) as Record<string, unknown>;
entry.scheduled = scheduled;
export default entry;
export { scheduled }; // 必须，防止 Rollup tree-shake
```

关键点：
- `entry.scheduled = scheduled` 让 Photon 的 `{ ...entry }` spread 自动包含 scheduled
- `export { scheduled }` 是必须的，否则 Rollup 认为 scheduled 未被使用会 tree-shake 掉
- 不需要额外的 Vite 插件

### `wrangler.jsonc`

- `main` 保持 `"virtual:photon:cloudflare:server-entry"`（不变）
- 新增 `triggers.crons` 配置：
```jsonc
"triggers": {
  "crons": ["*/5 * * * *"]
}
```

## PaymentLog 事件类型速查

| eventType | verifyStatus | 含义 |
|-----------|-------------|------|
| `CREATE_PAYMENT` | `PENDING` | 创建支付单 |
| `NOTIFY` | `VERIFIED` | 支付回调验签通过 |
| `NOTIFY` | `VERIFIED` | 竞态重开（message 含 `reopened from CLOSED`） |
| `NOTIFY` | `FAILED` | 支付回调验签失败 |
| `NOTIFY_AMOUNT_MISMATCH` | `FAILED` | 回调金额与订单不匹配 |
| `QUERY_PAID` | `VERIFIED` | 支付宝轮询确认已付 |
| **`AUTO_CLOSE`** | **`PENDING`** | **订单超时未支付，自动关闭** |

## 日志排查

在 Cloudflare Dashboard → Workers → edgekey → Observability 中搜索关键词：

- `cron.auto_close.completed` — 定时任务正常执行
- `cron.auto_close.failed` — 定时任务执行异常
- `cron.auto_close.missing_db_binding` — D1 数据库绑定缺失
- `auto_close_expired_orders` — 详细的关闭记录（含被关闭的订单号列表）

## 本地测试

```bash
# 启动开发服务器后，手动触发 scheduled 事件
bunx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## 线上验证

1. 部署后在 Cloudflare Dashboard → Workers → edgekey → Settings → Triggers 确认 Cron 已生效
2. 创建一个测试订单，不支付，等待 30+ 分钟后检查：
   - 订单列表中该订单状态变为"已关闭"
   - 订单详情的支付日志中有 `eventType = AUTO_CLOSE` 的记录
3. 在 Observability 面板搜索 `cron.auto_close` 确认日志输出正常

## 后续扩展

当前过期时间（30 分钟）为硬编码常量。如需可配置，可以：

1. 在 `SiteSetting` 表中新增 `orderExpireMinutes` 字段
2. 在 `autoCloseExpiredOrders` 中读取该配置
3. 在管理后台"站点设置"页面增加对应输入框

这样管理员可以自行调整过期时间，无需修改代码。
