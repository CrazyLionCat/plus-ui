import { describe, expect, it } from 'vitest';
import { hasOnlyPasswordGrant } from '../client-grants';

describe('基础模板客户端授权', () => {
  it('只接受单一密码授权', () => {
    expect(hasOnlyPasswordGrant(['password'])).toBe(true);
    for (const value of [undefined, [], ['sms'], ['password', 'email'], ['PASSWORD'], [' password'], ['password', 'password'], 'password']) {
      expect(hasOnlyPasswordGrant(value)).toBe(false);
    }
  });
});
