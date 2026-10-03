# 工作流

恢复 `src/views/workflow/`。可复用 `src/components/Process/`、UserSelect、RoleSelect 和 `src/api/workflow/` 已留在原位置，默认没有业务页面引用。

后端须启用 ruoyi-workflow、warm-flow 与关联规则配置，导入工作流 SQL，恢复菜单和角色授权；从 template-scope 中解除流程过滤。

需要选择组件时在 main.ts 恢复 vxe-pc-ui、vxe-table 插件与样式注册：

```ts
import VxeUIPlugin, { VxeUI } from 'vxe-pc-ui';
import VxeTablePlugin from 'vxe-table';
import 'vxe-pc-ui/lib/style.css';
import 'vxe-table/lib/style.css';
VxeUI.setConfig({ zIndex: 999999 });
// createApp 后：
app.use(VxeUIPlugin);
app.use(VxeTablePlugin);
```

恢复消息联动时，在 push-message.ts 允许 workflow 分类，push.ts 初始消息集合加入 workflowList，恢复消息盒子工作页签，核对未读数、全部已读及流程跳转。