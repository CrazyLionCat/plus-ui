# Demo

将本目录的 `src/views/demo/`、`src/api/demo/` 恢复到原位置。对应后端需启用 ruoyi-demo，准备演示表、数据、菜单和角色授权。

从 template-scope 的 demo 路径、组件和权限清单中移除对应项。默认生产前端继续排除 Demo。

后续业务开发可直接参考这里的单表/树表页面及 API/types，配合根目录 gen/*.ftl，不必先恢复运行。