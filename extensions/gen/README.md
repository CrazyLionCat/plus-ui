# 代码生成

恢复 `src/views/tool/gen/`、`src/api/tool/gen/`，从 template-scope 中解除代码生成路径、组件和权限过滤。根目录 gen/*.ftl 开发模板始终保留。

后端需显式激活 gen profile，恢复 tool:gen:* 菜单和角色授权。生产后端及前端默认不启用。

代码预览需要在 main.ts 恢复闲置的高亮注册，依赖已保留：

```ts
import HighLight from '@highlightjs/vue-plugin';
import 'highlight.js/styles/atom-one-dark.css';
import 'highlight.js/lib/common';
// createApp 后：
app.use(HighLight);
```