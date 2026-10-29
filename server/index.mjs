import './env.mjs'
import { config } from './env.mjs'
import { createApp } from './app.mjs'
import { flushDb, saveDb } from './db.mjs'

const app = await createApp({ serveStatic: config.isProd })

if (!config.isProd) {
  app.get('/', (_req, res) => {
    res
      .type('text/plain')
      .send(
        'Kola Adarsha Degree College API is running. Open the Vite development server at http://localhost:5173.',
      )
  })
}

const server = app.listen(config.port, () => {
  console.log(
    `[server] API listening on http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`,
  )
})

function shutdown() {
  try {
    saveDb()
    flushDb()
  } catch (error) {
    console.error('[server] Failed to persist data during shutdown:', error)
  }
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
