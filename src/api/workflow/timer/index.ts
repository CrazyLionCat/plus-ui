import type { PageResult, R } from '@/api/types';
import request from '@/api/request';
import type { EventWaitQuery, EventWaitSummary, EventWaitVO, TimerTriggerForm } from './types';

export function listEventWait(query: EventWaitQuery) {
  return request<R<PageResult<EventWaitVO>>>({ url: '/workflow/eventWait/list', method: 'get', params: query });
}

export function summaryEventWait(query: EventWaitQuery) {
  return request<R<EventWaitSummary>>({ url: '/workflow/eventWait/summary', method: 'get', params: query });
}

export function getEventWait(id: string | number) {
  return request<R<EventWaitVO>>({ url: `/workflow/eventWait/${id}`, method: 'get' });
}

/** 恢复已死的事件等待记录，定时启动任务除外 */
export function reviveEventWait(id: string | number) {
  return request<R<void>>({ url: `/workflow/eventWait/${id}/revive`, method: 'post' });
}

export function triggerTimerStart(data: TimerTriggerForm) {
  return request<R<string | number>>({ url: '/workflow/eventWait/trigger', method: 'post', data });
}
