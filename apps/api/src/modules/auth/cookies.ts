import { Response } from 'express';
import { env } from '../../config/env';
import { parseDurationToMs } from '../../utils/tokens';

const baseCookieOptions = {
  httpOnly: true,
  // sameSite: 'none' is only ever honored by browsers over HTTPS, so force
  // `secure` on whenever it's configured — a cross-origin deployment
  // (frontend on Vercel, API elsewhere) needs both together or the cookie
  // is silently rejected.
  secure: env.isProduction || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
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
