import { describe, expect, it } from 'vitest';
import { parsePushMessage, shouldAppendNotice } from '../push-message';

describe('默认消息范围', () => {
  it('保留系统和通知消息以及纯文本消息', () => {
    expect(shouldAppendNotice(parsePushMessage('欢迎登录'))).toBe(true);
    expect(shouldAppendNotice({ type: 'notice', source: 'notice' })).toBe(true);
    expect(shouldAppendNotice({ type: 'message', source: 'backend' })).toBe(true);
  });

  it('流程消息不能产生默认未读数和弹窗', () => {
    expect(shouldAppendNotice({ type: 'message', source: 'workflow' })).toBe(false);
    expect(shouldAppendNotice({ type: 'notice', source: 'workflow' })).toBe(false);
    expect(shouldAppendNotice({ type: 'message', category: 'workflow' })).toBe(false);
  });

  it('LLM 和自定义消息不进入消息盒子', () => {
    expect(shouldAppendNotice({ type: 'llm' })).toBe(false);
    expect(shouldAppendNotice({ type: 'custom' })).toBe(false);
  });
});
