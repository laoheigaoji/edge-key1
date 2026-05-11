# EdgeKey 项目开发规范指南

本指南为AI助手提供EdgeKey项目开发迭代的标准流程和规范要求，确保代码质量和项目一致性。

## 项目架构概览

### 技术栈
- **前端框架**: Vue 3 + Vike（文件路由 + SSR）
- **服务端**: Hono（路由与中间件）
- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1（原生SQLite）
- **ORM**: Prisma（Cloudflare适配器）
- **UI框架**: Tailwind CSS + daisyUI
- **构建工具**: Vite + Bun
- **认证**: Auth.js（管理员账号密码登录）
- **数据变更**: Telefunc（前后端同构RPC）

### 核心约束
1. **Cloudflare Workers环境限制**:
   - 禁止依赖`node:fs`、`node:path`等Node.js原生模块
   - 使用Web Crypto API（`crypto.subtle`）处理签名，避免第三方加密库
   - 脚本体积限制（免费版3MB），引入新依赖必须经过批准

2. **数据库特殊性**:
   - 使用Cloudflare D1（SQLite），非传统数据库
   - 开发环境使用本地D1模拟器，生产环境使用远程D1
   - 禁止使用`prisma migrate dev`，必须使用特定迁移工作流

## 开发流程规范

### 1. 环境准备
```bash
# 安装依赖（推荐使用Bun）
bun install
# 生成Prisma客户端（必须）
bun run db:generate
# 初始化本地数据库
bun run db:migrations:local
bun run db:seed
# 启动开发服务器
bun run dev
```

### 2. 数据库变更流程
**重要**: 修改数据库表结构时必须遵循以下流程：

#### 步骤1: 修改Schema并生成迁移SQL
```bash
# 修改 prisma/schema.prisma 后，使用prisma migrate diff生成SQL
bunx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/000X_描述.sql
```

#### 步骤2: 同步到本地开发环境
```bash
bun run db:migrations:local
```

#### 步骤3: 部署前同步到生产环境
```bash
bun run db:migrations:remote
```

**禁止操作**:
- ❌ 使用`prisma migrate dev`
- ❌ 反复覆盖初始化迁移文件`0001_init.sql`
- ❌ 假设`bun dev`使用的是`prisma/db.sqlite`

### 3. 代码提交与部署
```bash
# 构建项目
bun run build
# 本地预览构建结果
bun run preview
# 部署到Cloudflare Workers
bun run deploy
# 或等效命令
bun run up
```

## 代码规范

### 1. 文件组织
- **页面文件**: `pages/`目录，遵循Vike文件路由约定
- **组件**: `components/`目录，通用组件
- **业务逻辑**: `lib/`目录
- **功能模块**: `modules/`目录
- **服务端**: `server/`目录
- **数据库**: `prisma/`目录
- **静态资源**: `assets/`目录

### 2. 命名规范
- **Vue组件**: PascalCase（如`AppButton.vue`）
- **TypeScript文件**: camelCase（如`order-utils.ts`）
- **数据库模型**: PascalCase（如`Admin`、`Order`）
- **数据库字段**: camelCase（如`createdAt`、`paymentStatus`）

### 3. 组件开发规范
- 使用`<script setup>`语法
- Props定义必须包含类型和默认值
- 事件使用`emit`函数触发
- 样式优先使用Tailwind CSS类，必要时使用daisyUI组件

### 4. Telefunc使用规范
- Telefunc函数放在对应页面目录下，以`.telefunc.ts`结尾
- 函数命名: `on[Action]`（如`onCreateOrder`、`onUpdateProduct`）
- 返回类型必须明确声明

### 5. 日志规范
使用项目内置的`logger`模块：
```typescript
import { logger } from '@/lib/logger';

// 信息日志
logger.info('操作成功', { userId: 123, action: 'create_order' });
// 警告日志
logger.warn('库存不足', { productId: 456, stock: 2 });
// 错误日志
logger.error('支付失败', error, { orderId: 'ORD001' });
// 创建子日志记录器（带默认上下文）
const orderLogger = logger.child({ module: 'order', service: 'create' });
orderLogger.info('订单创建开始', { orderNo: 'ORD001' });
```

**日志级别使用原则**:
- `info`: 业务流程关键节点、重要操作记录
- `warn`: 可恢复的异常、资源不足、配置问题
- `error`: 不可恢复的错误、系统异常

**Cloudflare Workers限制**:
- `console.debug`不会出现在Cloudflare Dashboard中
- 统一使用`info`、`warn`、`error`三个级别

**日志上下文自动注入**:
- 请求上下文（requestId、method、path、cfRay）自动注入
- 错误对象自动序列化（包含name、message、stack、code、statusCode、details）
- 支持AppError和普通Error的序列化

**日志格式示例**:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "error",
  "requestId": "abc123",
  "method": "POST",
  "path": "/api/orders",
  "cfRay": "xyz789",
  "message": "支付失败",
  "error": {
    "name": "AppError",
    "message": "支付网关返回错误",
    "stack": "...",
    "code": "PAYMENT_GATEWAY_ERROR",
    "statusCode": 400,
    "details": { "provider": "bepusdt", "orderId": "ORD001" }
  },
  "module": "payment",
  "service": "verify"
}
```

## 架构设计规范

### 1. 中间件使用
- **请求上下文**: 通过`createRequestContext`和`runWithRequestContext`管理
- **数据库注入**: 通过`prismaMiddleware`注入Prisma实例
- **认证**: 通过`authjsSessionMiddleware`处理会话
- **API路由**: 独立的Hono子应用，优先于页面路由

### 2. 错误处理
使用项目内置的错误处理机制：
```typescript
import { AppError, toAppError, badRequestError, notFoundError, conflictError, unauthorizedError } from '@/lib/app-error';

// 使用预定义的错误工厂函数
throw notFoundError('订单不存在', 'ORDER_NOT_FOUND');
throw badRequestError('购买数量不合法', 'ORDER_QUANTITY_INVALID');
throw conflictError('数据已存在，请检查是否重复', 'UNIQUE_CONSTRAINT');
throw unauthorizedError('请先登录管理员账号');

// 或使用通用AppError
throw new AppError('自定义错误消息', {
  code: 'CUSTOM_ERROR',
  statusCode: 400,
  details: { field: 'value' }
});

// 转换未知错误（自动处理Prisma错误、Telefunc错误等）
try {
  // 业务逻辑
} catch (error) {
  const appError = toAppError(error);
  logger.error('操作失败', appError);
  throw appError;
}

// 断言条件
assertCondition(order != null, notFoundError('订单不存在'));

// 获取错误消息（兼容字符串、Error、AppError）
const message = getErrorMessage(error, '未知错误');
```

**错误工厂函数**:
- `badRequestError()`: 400 - 请求参数错误
- `unauthorizedError()`: 401 - 未授权
- `forbiddenError()`: 403 - 禁止访问
- `notFoundError()`: 404 - 资源不存在
- `conflictError()`: 409 - 数据冲突
- `rateLimitError()`: 429 - 请求过于频繁
- `externalServiceError()`: 502 - 外部服务错误
- `internalServerError()`: 500 - 服务器内部错误

**错误转换规则**:
- Prisma P2002错误 → 冲突错误（唯一约束冲突）
- Telefunc Abort错误 → 自动提取错误信息
- "Unauthorized"错误 → 未授权错误
- 其他错误 → 内部服务器错误

**错误响应格式**:
```typescript
// toErrorResponsePayload() 返回标准格式
{
  message: string;  // 用户友好的错误消息（expose为false时返回通用消息）
  code?: string;    // 错误代码
  statusCode: number; // HTTP状态码
}
```

### 3. 实用工具函数
项目提供多个实用工具函数：
```typescript
import { formatMoney, parseMoney } from '@/lib/utils/money';
import { getOrderStatusLabel, getOrderStatusType } from '@/lib/utils/order-status';
import { formatDate, formatRelativeTime } from '@/lib/utils/time';
import { generateOrderNo, generateQueryToken } from '@/lib/utils/order';
import { hashPassword, verifyPassword } from '@/lib/utils/crypto';
import { detectDeviceType } from '@/lib/utils/device';

// 金额处理（单位：分）
const formatted = formatMoney(1000); // '10.00'
const cents = parseMoney('10.00'); // 1000

// 订单状态标签
const label = getOrderStatusLabel('PAID'); // '已支付'
const type = getOrderStatusType('PAID'); // 'success'

// 时间格式化
const dateStr = formatDate(new Date()); // '2024-01-01'
const relative = formatRelativeTime(new Date()); // '刚刚'

// 订单号生成
const orderNo = generateOrderNo(); // 'ORD20240101001'
const queryToken = generateQueryToken(); // 32位随机字符串

// 密码处理（使用bcrypt）
const hash = await hashPassword('password123');
const isValid = await verifyPassword('password123', hash);

// 设备检测
const device = detectDeviceType(request); // 'mobile' | 'desktop'
```

### 4. 常量和类型定义
项目定义的常量和类型：
```typescript
// 常量定义
import { PAYMENT_PROVIDERS } from '@/lib/constants/payment';
import { ORDER_QUERY_TOKEN_LENGTH } from '@/lib/constants/order';
import { PRODUCT_STATUS, ORDER_STATUS } from '@/lib/constants/product';

// 类型定义
import type { Order, OrderStatus, PaymentStatus } from '@/lib/types/order';
import type { Product, ProductStatus } from '@/lib/types/product';
import type { SiteSetting } from '@/lib/types/site';
import type { CommonResponse, PaginatedResponse } from '@/lib/types/common';
```

**数据库枚举类型**:
- `AdminStatus`: ACTIVE, DISABLED
- `CategoryStatus`: ACTIVE, DISABLED
- `ProductStatus`: DRAFT, ACTIVE, INACTIVE
- `ProductDeliveryType`: CARD_AUTO, MANUAL
- `ProductStockMode`: FINITE, UNLIMITED
- `CardStatus`: UNUSED, LOCKED, SOLD, DISABLED
- `ContactType`: EMAIL, QQ, TELEGRAM, OTHER
- `OrderStatus`: PENDING, PAID, DELIVERED, CLOSED, FAILED
- `PaymentStatus`: UNPAID, PAID, FAILED
- `DeliveryStatus`: NOT_DELIVERED, DELIVERED, FAILED
- `EmailChannel`: API, SMTP, CLOUDFLARE
- `EmailScene`: TEST, ORDER_PAID, DELIVERY_SUCCESS, DELIVERY_FAILED

### 5. 重要项目文件
以下是开发时需要了解的关键文件：

**核心配置文件**:
- `package.json`: 项目依赖和脚本命令
- `vite.config.ts`: Vite构建配置（包含Vike、Vue、Tailwind、Telefunc插件）
- `wrangler.jsonc`: Cloudflare Workers部署配置（包含D1数据库绑定）
- `prisma/schema.prisma`: 数据库模型定义

**服务端入口**:
- `server/entry.ts`: 服务端主入口（Hono应用、中间件链）
- `server/authjs-handler.ts`: Auth.js认证处理器
- `server/prisma-middleware.ts`: Prisma D1注入中间件
- `server/telefunc-handler.ts`: Telefunc RPC处理器

**核心库文件**:
- `lib/logger.ts`: 日志模块（自动注入请求上下文、错误序列化）
- `lib/app-error.ts`: 错误处理模块（AppError类、错误工厂函数）
- `lib/request-context.ts`: 请求上下文管理（AsyncLocalStorage）

**业务模块**:
- `modules/payment/`: 支付相关（适配器、服务、路由）
- `modules/email/`: 邮件相关（模板、发送、日志）
- `modules/order/`: 订单管理
- `modules/inventory/`: 库存管理

**前端页面**:
- `pages/`: Vike文件路由目录
- `components/`: 通用Vue组件
- `assets/`: 静态资源

### 6. Telefunc使用模式
Telefunc提供前后端同构的数据变更RPC：
```typescript
// pages/admin/orders/createOrder.telefunc.ts
import { getContext } from 'telefunc';
import type { PrismaClient } from '../../generated/prisma/client';
import { badRequestError } from '../../lib/app-error';
import { logger } from '../../lib/logger';
import { validateOrderInput } from '../../lib/validators/order';

export async function onCreateOrder(input: {
  productId: number;
  quantity: number;
  contactValue: string;
}) {
  // 获取上下文（自动包含Prisma实例）
  const { prisma } = getContext() as { prisma: PrismaClient };
  
  // 验证输入
  const validated = validateOrderInput(input);
  
  // 业务逻辑
  const order = await prisma.order.create({
    data: {
      orderNo: generateOrderNo(),
      productId: input.productId,
      quantity: validated.quantity,
      contactValue: validated.contactValue,
      // ... 其他字段
    }
  });
  
  logger.info('订单创建成功', { orderNo: order.orderNo });
  return { orderNo: order.orderNo };
}
```

**Telefunc约定**:
- 函数放在页面目录下，以`.telefunc.ts`结尾
- 命名规范: `on[Action]`（如`onCreateOrder`、`onUpdateProduct`）
- 通过`getContext()`获取请求上下文（包含prisma实例）
- 返回值自动序列化为JSON
- 错误会自动转换为Telefunc Abort格式

**本地开发与生产环境差异**:
- 本地开发: 使用Wrangler D1模拟器
- 生产环境: 使用Cloudflare远程D1
- 数据库绑定: `env.DB`在两个环境中都可用
- Prisma配置: 运行时使用`env.DB`，CLI使用`DATABASE_URL`


## 文档维护

### 1. 更新README.md
重大功能变更后，更新README.md中的功能特性和项目截图。

### 2. 更新组件文档
新增或修改公共组件时，更新`docs/components.md`。

### 3. 更新支付网关文档
新增支付网关时，更新`docs/payment-gateway-guide.md`。

## 代码审查要点

### 1. 安全性
- 密码是否使用bcrypt加密
- API密钥是否硬编码
- SQL注入防护（Prisma自动处理）

### 2. 性能
- 数据库查询是否优化
- 是否有N+1查询问题
- 静态资源是否优化

### 3. 可维护性
- 代码是否有适当注释
- 是否遵循项目架构规范
- 是否有重复代码

## 参考资源

1. **项目文档**:
   - `README.md`: 项目概述和快速开始
   - `docs/components.md`: 组件使用指南
   - `docs/payment-gateway-guide.md`: 支付网关开发指南

2. **官方文档**:
   - [Vike](https://vike.dev/): 文件路由框架
   - [Vue 3](https://vuejs.org/): 前端框架
   - [Hono](https://hono.dev/): 服务端框架
   - [Prisma](https://www.prisma.io/): ORM框架
   - [Cloudflare Workers](https://developers.cloudflare.com/workers/): 运行时环境

3. **工具文档**:
   - [Wrangler](https://developers.cloudflare.com/workers/wrangler/): Cloudflare CLI
   - [Bun](https://bun.sh/): JavaScript运行时和包管理器

---

**重要提醒**: 在进行任何修改前，请确保理解项目架构和约束条件。对于不确定的操作，建议先在开发环境测试，确认无误后再部署到生产环境。

## 快速参考

### 常用命令
```bash
# 开发
bun install                    # 安装依赖
bun run dev                    # 启动开发服务器
bun run build                  # 构建项目
bun run preview                # 预览构建结果

# 数据库
bun run db:generate            # 生成Prisma客户端
bun run db:migrations:local    # 应用迁移到本地D1
bun run db:migrations:remote   # 应用迁移到远程D1
bun run db:seed                # 本地种子数据
bun run db:seed:remote         # 远程种子数据
bun run db:studio              # Prisma Studio

# 部署
bun run deploy                 # 部署到Cloudflare Workers
bun run up                     # 构建并部署
bun run types                  # 生成Wrangler类型
```

### 常见模式
```typescript
// 1. 日志记录
import { logger } from '@/lib/logger';
logger.info('操作成功', { key: 'value' });
logger.error('操作失败', error);

// 2. 错误处理
import { notFoundError, badRequestError } from '@/lib/app-error';
throw notFoundError('资源不存在');

// 3. 输入验证
import { validateOrderInput } from '@/lib/validators/order';
const data = validateOrderInput(input);

// 4. Telefunc函数
import { getContext } from 'telefunc';
const { prisma } = getContext() as { prisma: PrismaClient };

// 5. 数据库查询
const orders = await prisma.order.findMany({
  where: { status: 'PAID' },
  include: { product: true },
  skip: 0,
  take: 20
});
```

### 项目结构速查
```
edgeKey/
├── pages/           # Vike页面路由
├── components/      # Vue组件
├── lib/             # 核心库（logger、error、utils）
├── modules/         # 业务模块（payment、email、order）
├── server/          # 服务端（Hono、中间件）
├── prisma/          # 数据库模型和迁移
├── assets/          # 静态资源
└── docs/            # 文档
```

### 关键约束速查
- ❌ 禁止使用`node:fs`、`node:path`等Node.js原生模块
- ❌ 禁止使用`prisma migrate dev`
- ✅ 使用Web Crypto API处理签名
- ✅ 使用项目内置的logger模块
- ✅ 遵循数据库迁移工作流
- ✅ 生产环境必须配置AUTH_SECRET