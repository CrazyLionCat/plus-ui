import { history } from '@umijs/max';
import { normalizePath } from '@/utils/ruoyi';
import type { RouterJumpVO } from './types';

export function routerJump(routerJump: RouterJumpVO) {
  const query = new URLSearchParams({
    type: routerJump.type,
    taskId: String(routerJump.taskId)
  });
  if (routerJump.businessId) query.set('id', routerJump.businessId);
  if (routerJump.instanceId != null) query.set('instanceId', String(routerJump.instanceId));
  history.push(
    `${normalizePath(routerJump.formPath || '/workflow/leaveEdit/index')}?${query.toString()}`
  );
}

export default {
  routerJump
};
