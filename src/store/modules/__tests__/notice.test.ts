import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useNoticeStore, type NoticeItem } from '../notice';

const message = (messageId: number, category: string): NoticeItem => ({
  messageId,
  category,
  source: category === 'system' ? 'backend' : category,
  type: category === 'notice' ? 'notice' : 'message',
  read: false,
  message: '消息内容',
  time: ''
});

describe('默认消息盒子状态', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('初次加载排除流程消息，未读数和全部已读只覆盖系统与通知', () => {
    const store = useNoticeStore();
    store.setNotices([message(1, 'system'), message(2, 'notice'), message(3, 'workflow')]);
    expect(store.state.notices.map(item => item.messageId)).toEqual([1, 2]);
    expect(store.unreadCount).toBe(2);
    store.readAll();
    expect(store.unreadCount).toBe(0);
  });

  it('实时流程推送不能增加未读数，普通推送去重且可标记已读', () => {
    const store = useNoticeStore();
    store.addNotice(message(3, 'workflow'));
    expect(store.unreadCount).toBe(0);
    store.addNotice(message(1, 'system'));
    store.addNotice(message(1, 'system'));
    expect(store.unreadCount).toBe(1);
    expect(store.state.notices).toHaveLength(1);
    store.markRead(1);
    expect(store.unreadCount).toBe(0);
  });
});
