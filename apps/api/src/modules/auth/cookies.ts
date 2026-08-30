import { Response } from 'express';
import { env } from '../../config/env';
import { parseDurationToMs } from '../../utils/tokens';

const baseCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  domain: env.cookieDomain,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions,
    maxAge: parseDurationToMs(env.jwtAccessExpiresIn),
  });
  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions,
    maxAge: parseDurationToMs(env.jwtRefreshExpiresIn),
    path: '/api/auth',
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { ...baseCookieOptions });
  res.clearCookie('refreshToken', { ...baseCookieOptions, path: '/api/auth' });
}
