/**
 * 登录请求
 */
export interface LoginData {
  username?: string;
  password?: string;
  rememberMe?: boolean;
  code?: string;
  uuid?: string;
  clientId: string;
  grantType: 'password';
}

/**
 * 登录响应
 */
export interface LoginResult {
  access_token: string;
}

/**
 * 验证码返回
 */
export interface VerifyCodeResult {
  captchaEnabled: boolean;
  uuid?: string;
  img?: string;
}

/**
 * 分页返回结果
 */
export interface PageResult<T = any> {
  total: number;
  rows: T[];
}
