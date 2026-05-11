# Change Log

## v1.3.0 (2026-05-10)

### Features

- **image:** 上传图片时支持浏览器端 WebP 压缩，自动检测浏览器能力，用户可自由开关，压缩失败时自动降级 ([3e2e8d5](https://github.com/34892002/edgeKey/commit/3e2e8d5))
- **file-upload:** 选择文件组件 ([74842cd](https://github.com/34892002/edgeKey/commit/74842cd))
- **s3:** 新增s3协议文件管理，提供文件上传、删除功能 ([2c3a332](https://github.com/34892002/edgeKey/commit/2c3a332))

### Bug Fixes

- **lint:** 规范项目编码，消除 18 处内联 `import()` 写法，统一改为顶部 `import type` ([370b975](https://github.com/34892002/edgeKey/commit/370b975))

### Documentation

- **docs:** 更新说明 ([5a0f09d](https://github.com/34892002/edgeKey/commit/5a0f09d))

## v1.2.2 (2026-04-30)

### Features

- 初始化项目基础架构
- 后台管理系统基础框架
- 商品管理、订单管理、卡密管理
- S3 文件存储集成
- 媒体库基础功能
