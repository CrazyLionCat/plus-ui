import type { PageQuery } from '@/api/types';

export interface EventWaitVO {
  id: string | number;
  definitionId?: string | number;
  flowName?: string;
  instanceId?: string | number;
  businessId?: string;
  nodeCode?: string;
  eventType?: string;
  eventTypeName?: string;
  eventName?: string;
  attachedTaskId?: string | number;
  triggerType?: string;
  triggerInterval?: string;
  nextTriggerAt?: string;
  timezone?: string;
  repeatCount?: number;
  maxRepeatCount?: number;
  status?: string;
  statusName?: string;
  retryCount?: number;
  maxRetryCount?: number;
  retryAt?: string;
  payload?: string;
  lastError?: string;
  createTime?: string;
  updateTime?: string;
  timerEnabled?: boolean;
}

export interface EventWaitQuery extends PageQuery {
  statuses?: string;
  eventTypes?: string;
  timerOnly?: boolean;
  flowCode?: string;
  businessId?: string;
  nodeCode?: string;
  eventName?: string;
  nextTriggerAtFrom?: string;
  nextTriggerAtTo?: string;
}

export interface EventWaitSummary {
  waiting: number;
  retry: number;
  running: number;
  dead: number;
  cancelled: number;
}

export interface TimerTriggerForm {
  waitId: string | number;
  businessId?: string;
  variables?: Record<string, unknown>;
}
