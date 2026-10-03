# AI

恢复 `src/views/ai/` 和 `src/api/ai/`，从 template-scope 中解除 AI 过滤。

后端须启用 ruoyi-ai、配置 SnailAI 服务并准备对应数据库、菜单和角色权限。聊天页面会调用 Snail 用户注册接口并加载 iframe，应实际验证服务地址和访问授权。