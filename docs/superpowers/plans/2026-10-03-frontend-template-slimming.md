# 前端基础模板精简实施计划

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 按已确认方案精简默认前端，保留可复用组件及必要依赖。
**Architecture:** 可选页面移入 extensions，基础前端继续使用原动态路由与消息模块；增加小型纯函数处理旧菜单、禁用目标与密码授权校验，不建立插件系统。
**Tech Stack:** 当前 Vue 3、TypeScript、Element Plus、Pinia、Vite、pnpm、Vitest。
**Spec:** `docs/superpowers/specs/2026-10-03-frontend-template-slimming-design.md`

## Global Constraints

- 注册和社交链路删除；管理员新增用户保留。
- 可复用组件保留原源码、必要 API/types、资源和依赖，目前不引用。
- 可选页面退出默认扫描、路由与构建，保留恢复源码；gen 开发模板保留。
- 不修改后端、已有数据库和部署环境；不推送、不发布。
- UTF-8、LF、2 空格缩进，按现有 oxlint/oxfmt 规范。

## Review Focus

- 旧菜单可能使用组件路径、相对子路径、外链或重定向；不得误删基础菜单。
- 隐藏页仍可能通过 import.meta.glob 或全局注册进入产物。
- 后端流程消息可能同时通过初始加载和 SSE/WebSocket 推送到前端。
- 旧客户端混合授权数据必须可见且不可在保存其他字段时被悄悄改写。
- 保留组件不能因依赖移走而丧失类型检查或恢复能力。

## Task 1: 认证与客户端授权

**Files:** login.vue、profile/index.vue、api/login.ts、api/types.ts、router/index.ts、permission.ts、lang/*、system/client/index.vue；新增 utils/client-grants.ts 及行为测试。
**Interfaces:** `hasOnlyPasswordGrant(value: unknown): boolean`，供客户端表单校验使用。

- [x] 增加授权行为测试：仅 password 可保存，混合、空值、未知类型不通过。
- [x] 运行测试确认缺少校验行为，再实现纯函数和表单规则；旧值展示不改变。
- [x] 清理注册、社交、回调、个人中心挂载请求和专用文案。
- [x] 检查残留引用，保留密码登录、管理员用户管理与个人中心基础功能。

## Task 2: 可选页面与路由

**Files:** views/demo、ai、workflow、monitor/{admin,snailjob,snailai}、tool/gen；对应可独立 API；新增 utils/template-scope.ts 及测试；store/modules/permission.ts。
**Interfaces:** `isDisabledTemplateTarget(path: string): boolean`；`filterTemplateRoutes(routes, hasView, warn): routes`，保留有效路由、外链和容器，去掉退出模块、空容器和无效组件。

- [x] 写路由行为测试：保留基础页面/外链，过滤旧模块，处理相对路径、空父目录与重定向，并且不修改原菜单数据。
- [x] 运行测试确认功能缺失，再实现并接入所有动态菜单分支。
- [x] 验证绝对路径后移出可选页面，保留原目录层级；保留 Process 与 workflow API/types。
- [x] 取消闲置的高亮与 vxe 全局注册，保留依赖与组件。
- [x] 写恢复说明，记录页面路径、后端条件、配置与权限。

## Task 3: 消息显示与跳转

**Files:** utils/push-message.ts、push.ts、store/modules/notice.ts、layout/components/notice/index.vue；行为测试。
**Interfaces:** 沿用消息结构，`shouldAppendNotice` 判断默认可展示分类；`isDisabledTemplateTarget` 判断消息跳转目标。

- [x] 写流程消息过滤测试，覆盖 source/category/目标路径和正常通知。
- [x] 先看到旧代码测试失败，再同步过滤初次加载、实时推送和 store 的消息。
- [x] 删除工作页签；全部已读只处理可展示消息；退出模块目标提示未启用。
- [x] 保留 workflowList 合同与解析、推送连接和退出关闭逻辑。

## Task 4: 配置、文案与交付

**Files:** views/index.vue、login.vue、.env._、types/env.d.ts、README、extensions/_/README.md、docs；保留组件不重写。

- [x] 首页改为基础模板说明；登录页介绍仅显示保留能力。
- [x] 移出控制台地址，保留代理、客户端、加密、消息配置。
- [x] 格式化改动文件；构建后运行 vue-tsc、lint、Vitest 全套和产物检查。
- [x] 尽可能用真实浏览器和已精简后端联调；没有运行环境时明确记录未验证项。
- [x] 完成一次独立代码审查，处理影响功能的发现，更新实施结果。

## 执行记录

- 用户已确认设计并授权实施，本计划作为具体执行记录，不再另行请求同一实施授权。
- 工作区原来只有本次待确认方案文件；在当前 checkout 创建 `codex/frontend-template-slimming`，保持可直接审查的未提交改动，不自动提交或推送。
- 原始 lint、生产构建通过；首次 vue-tsc 在自动导入声明生成前失败，构建生成声明后重新记录基线。