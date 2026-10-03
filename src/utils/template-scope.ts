interface TemplateRoute {
  path: string;
  component?: unknown;
  redirect?: unknown;
  children?: TemplateRoute[];
  permissions?: string[];
}

const disabledPaths = [
  '/register',
  '/social-callback',
  '/demo',
  '/ai',
  '/workflow',
  '/tool/gen',
  '/tool/genEdit',
  '/tool/gen-edit',
  '/monitor/admin',
  '/monitor/snailjob',
  '/monitor/snailai'
];
const disabledViews = ['demo', 'ai', 'workflow', 'tool/gen', 'monitor/admin', 'monitor/snailjob', 'monitor/snailai'];
const disabledPermissions = [
  'demo:',
  'workflow:',
  'ai:',
  'tool:gen:',
  'monitor:admin:',
  'monitor:snailjob:',
  'monitor:snailai:'
];
const containers = new Set(['Layout', 'ParentView']);
const external = (path: string) => /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path);

const normalizePath = (path: string) => {
  if (external(path)) return path;
  let value = path.split(/[?#]/)[0];
  try {
    value = decodeURIComponent(value);
  } catch {
    /* 保留无法解码的路径，交给正常路由处理。 */
  }
  return ('/' + value).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
};

const belongsTo = (value: string, prefix: string) => value === prefix || value.startsWith(prefix + '/');
const fullPath = (path: string, parent: string) => {
  return external(path) || path.startsWith('/') ? normalizePath(path) : normalizePath(parent + '/' + path);
};

/** 只匹配默认已退出的内部页面，不拦截普通外部链接或名称相似的业务页面。 */
export const isDisabledTemplateTarget = (path: string): boolean => {
  if (external(path)) return false;
  const value = normalizePath(path);
  return disabledPaths.some(prefix => belongsTo(value, prefix));
};

/** 在各菜单分支复制数据前统一过滤，输入菜单保持不变。 */
export const filterTemplateRoutes = <T extends TemplateRoute>(
  routes: T[],
  hasView: (view: string) => boolean,
  warn: (message: string) => void = console.warn,
  parentPath = ''
): T[] => {
  const result: T[] = [];
  for (const route of routes) {
    const path = fullPath(route.path, parentPath);
    const component = typeof route.component === 'string' ? route.component : '';
    const view = component.replace(/^\/+/, '').replace(/\.vue$/, '');
    if (
      isDisabledTemplateTarget(path) ||
      disabledViews.some(prefix => belongsTo(view, prefix)) ||
      route.permissions?.some(permission => disabledPermissions.some(prefix => permission.startsWith(prefix)))
    )
      continue;

    const copy = { ...route };
    if (route.children) {
      copy.children = filterTemplateRoutes(route.children, hasView, warn, path);
      if (!copy.children.length && (containers.has(component) || !component)) continue;
    } else if (containers.has(component) && !external(path)) {
      continue;
    }

    if (component && !containers.has(component) && component !== 'InnerLink' && !hasView(view)) {
      warn(`菜单组件不存在，已跳过：${view} (${path})`);
      continue;
    }
    if (component && !containers.has(component) && component !== 'InnerLink') {
      copy.component = view;
    }
    if (!component && !copy.children?.length && !external(path)) {
      warn(`菜单缺少组件，已跳过：${path}`);
      continue;
    }
    if (typeof copy.redirect === 'string' && isDisabledTemplateTarget(fullPath(copy.redirect, path))) {
      copy.redirect = copy.children?.length ? fullPath(copy.children[0].path, path) : undefined;
    }
    result.push(copy);
  }
  return result;
};
