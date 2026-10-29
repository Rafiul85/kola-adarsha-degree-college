import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { config, rootDir } from './env.mjs'
import { flushDb, initDb, refreshDb, usePostgres } from './db.mjs'
import { attachUser, ensureInitialAdmin, originGuard } from './auth.mjs'
import { apiNotFound, asyncHandler, errorHandler } from './http.mjs'
import authRoutes from './routes/auth.mjs'
import publicRoutes from './routes/public.mjs'
import dashboardRoutes from './routes/dashboard.mjs'
import adminRoutes from './routes/admin.mjs'

/**
 * Builds the Express application shared by the Node entry (server/index.mjs)
 * and the Vercel serverless entry (api/[...path].mjs).
 */
export async function createApp({ serveStatic = false } = {}) {
  await initDb()
  ensureInitialAdmin()
  await flushDb()

  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    if (config.isProd) {
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data:",
          "connect-src 'self'",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      )
      if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains')
      }
    }
    next()
  })

  if (usePostgres) {
    app.use(
      asyncHandler(async (req, _res, next) => {
        if (req.path.startsWith('/api/')) await refreshDb()
        next()
      }),
    )
  }

  app.use(express.json({ limit: '5mb' }))
  app.use(express.urlencoded({ extended: false, limit: '1mb' }))
  app.use((req, res, next) => {
    const privateApi =
      req.path.startsWith('/api/auth') ||
      req.path.startsWith('/api/dashboard') ||
      req.path.startsWith('/api/admin') ||
      req.path === '/api/public/results/search'
    if (privateApi) res.setHeader('Cache-Control', 'no-store')
    next()
  })
  app.use(originGuard)
  app.use(attachUser)

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'Kola Adarsha Degree College website',
      environment: config.isProd ? 'production' : 'development',
      storage: usePostgres ? 'postgres' : 'file',
      time: new Date().toISOString(),
    })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/public', publicRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api', apiNotFound)

  if (serveStatic) {
    const distDir = path.join(rootDir, 'dist')
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
      throw new Error('dist/index.html not found. Run `npm run build` before starting the server.')
    }
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), {
        immutable: true,
        maxAge: '1y',
        fallthrough: true,
      }),
    )
    app.use(
      express.static(distDir, {
        index: false,
        maxAge: 0,
        setHeaders(res, filePath) {
          if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store')
        },
      }),
    )
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next()
      res.setHeader('Cache-Control', 'no-store')
      res.sendFile(path.join(distDir, 'index.html'))
    })
  }

  app.use(errorHandler)
  return app
}
