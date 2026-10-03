import { describe, expect, it, vi } from 'vitest';
import { filterTemplateRoutes, isDisabledTemplateTarget } from '../template-scope';

describe('基础模板菜单范围', () => {
  const hasView = (view: string) => ['system/user/index', 'monitor/cache/index'].includes(view);

  it('过滤旧模块，保留基础页面，不改写后端数据', () => {
    const routes = [
      {
        path: '/system',
        component: 'Layout',
        children: [
          { path: 'user', component: 'system/user/index' },
          { path: 'demo', component: 'demo/demo/index' }
        ]
      }
    ];
    const original = structuredClone(routes);
    expect(filterTemplateRoutes(routes, hasView)[0].children?.map(item => item.path)).toEqual(['user']);
    expect(routes).toEqual(original);
  });

  it('去掉空目录和工作流外链，保留基础外链与缓存页', () => {
    const routes = [
      { path: '/workflow', component: 'Layout', children: [{ path: 'task', component: 'workflow/task/taskWaiting' }] },
      { path: '/test', component: 'Layout', children: [{ path: 'demo', component: 'demo/demo/index' }] },
      {
        path: '/monitor',
        component: 'Layout',
        children: [
          { path: 'snailjob', component: 'InnerLink', permissions: ['monitor:snailjob:list'] },
          { path: 'cache', component: 'monitor/cache/index' }
        ]
      },
      { path: 'https://example.com/docs', component: 'InnerLink' }
    ];
    const result = filterTemplateRoutes(routes, hasView);
    expect(result.map(item => item.path)).toEqual(['/monitor', 'https://example.com/docs']);
    expect(result[0].children?.map(item => item.path)).toEqual(['cache']);
  });

  it('无效组件有明确诊断，不会变成空白页', () => {
    const warn = vi.fn();
    expect(
      filterTemplateRoutes([{ path: '/system/missing', component: 'system/missing/index' }], hasView, warn)
    ).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('system/missing/index'));
  });

  it('合法组件路径统一为动态加载表中的路径', () => {
    const result = filterTemplateRoutes([{ path: '/system/user', component: '/system/user/index.vue' }], hasView);
    expect(result[0].component).toBe('system/user/index');
  });

  it('父目录指向退出页面时改为第一个保留子页面', () => {
    const result = filterTemplateRoutes(
      [
        {
          path: '/monitor',
          component: 'Layout',
          redirect: '/monitor/snailjob',
          children: [{ path: 'cache', component: 'monitor/cache/index' }]
        }
      ],
      hasView
    );
    expect(result[0].redirect).toBe('/monitor/cache');
  });

  it('真实代码生成编辑路径不会成为消息或菜单跳转目标', () => {
    expect(isDisabledTemplateTarget('/tool/gen-edit/index/42?from=list')).toBe(true);
    expect(isDisabledTemplateTarget('/tool/gen-editing')).toBe(false);
    const result = filterTemplateRoutes(
      [
        {
          path: '/monitor',
          component: 'Layout',
          redirect: '/tool/gen-edit/index/42',
          children: [{ path: 'cache', component: 'monitor/cache/index' }]
        }
      ],
      hasView
    );
    expect(result[0].redirect).toBe('/monitor/cache');
  });

  it('识别完整路径和编码路径，不能误拦截相似基础路径或正常外链', () => {
    for (const path of [
      '/workflow/task?x=1',
      '/ai/chat',
      '/tool/gen',
      '/tool/genEdit/index',
      '/monitor/snailai',
      '/monitor/snailjob',
      '/monitor/admin',
      '/register',
      '/social-callback',
      '/%77orkflow/task'
    ]) {
      expect(isDisabledTemplateTarget(path), path).toBe(true);
    }
    for (const path of [
      '/system/user',
      '/monitor/cache',
      '/workflow-settings',
      'https://example.com/workflow',
      '/tool/general'
    ]) {
      expect(isDisabledTemplateTarget(path), path).toBe(false);
    }
  });
});
