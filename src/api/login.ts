import type { UserInfo } from '@/api/system/user/types';
import type { AxiosPromise } from '@/utils/api-types';
import { closePush } from '@/utils/push';
import request from '@/utils/request';
import type { LoginData, LoginResult, VerifyCodeResult } from './types';

// pc端固定客户端授权id
const clientId = import.meta.env.VITE_APP_CLIENT_ID;

/**
 * @param data {LoginData}
 * @returns
 */
export function login(data: LoginData): AxiosPromise<LoginResult> {
  const params = {
    ...data,
    clientId: data.clientId || clientId,
    grantType: 'password'
  };
  return request({
    url: '/auth/login',
    headers: {
      isToken: false,
      isEncrypt: true,
      repeatSubmit: false
    },
    method: 'post',
    data: params
  });
}

/**
 * 注销
 */
export function logout() {
  closePush();
  if (
    import.meta.env.VITE_APP_MESSAGE_ENABLED === 'true' &&
    import.meta.env.VITE_APP_MESSAGE_TRANSPORT.toLowerCase() === 'sse'
  ) {
    request({
      url: import.meta.env.VITE_APP_MESSAGE_PATH + '/close',
      method: 'get'
    });
  }
  return request({
    url: '/auth/logout',
    method: 'post'
  });
}

/**
 * 获取验证码
 */
export function getCodeImg(): AxiosPromise<VerifyCodeResult> {
  return request({
    url: '/auth/code',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  });
}

// 获取用户详细信息
export function getInfo(): AxiosPromise<UserInfo> {
  return request({
    url: '/system/user/getInfo',
    method: 'get'
  });
}
