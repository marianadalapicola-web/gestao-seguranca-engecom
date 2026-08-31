import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  // Comma-separated list so the API can be called from a frontend hosted on
  // a different origin (e.g. frontend on Vercel, API on Railway) in addition
  // to same-origin deployments.
  webAppUrls: (process.env.WEB_APP_URL ?? 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  // 'lax' works when the frontend and API share an origin. Cross-origin
  // setups (separate frontend/API hosts) need 'none', which browsers only
  // honor over HTTPS — that's already enforced by the `secure` cookie flag
  // in production.
  cookieSameSite: (process.env.COOKIE_SAME_SITE as 'lax' | 'none' | 'strict' | undefined) ?? 'lax',
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  isProduction: process.env.NODE_ENV === 'production',
};
