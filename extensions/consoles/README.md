# 外部控制台

按需恢复 `src/views/monitor/admin/`、snailjob/、snailai/，从 template-scope 中解除对应控制台的路径、组件和权限过滤。缓存、日志、在线用户已保留，无须恢复。

将 env 示例中的所选地址加入实际 .env，并把 optional-env.d.ts 中对应声明加入 src/types/env.d.ts。

- admin：启用 Spring Boot Admin 服务与后端客户端，恢复 monitor:admin:list 菜单授权。
- snailjob：启用 ruoyi-job、SnailJob 客户端与服务端，准备任务库，恢复 monitor:snailjob:list 授权。
- snailai：配置 SnailAI 客户端与服务端、对应数据库，恢复 monitor:snailai:list 授权。

示例地址不是已验证的部署地址；恢复时核对代理、子路径、认证和 iframe 加载。