import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

try {
  const envFile = path.join(rootDir, '.env')
  if (fs.existsSync(envFile)) process.loadEnvFile(envFile)
} catch {
  // Environment variables can also be supplied by the hosting platform.
}

export const config = {
  port: Number(process.env.PORT || 3001),
  isProd: process.argv.includes('--prod') || process.env.NODE_ENV === 'production',
  isServerless: Boolean(process.env.VERCEL),
  databaseUrl: (process.env.DATABASE_URL || '').trim(),
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminName: (process.env.ADMIN_NAME || 'Administrator').trim(),
  appOrigin: (process.env.APP_ORIGIN || '').trim(),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  sessionHours: 12,
  resetMinutes: 60,
}
