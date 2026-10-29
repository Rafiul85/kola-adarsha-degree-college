import { createApp } from '../server/app.mjs'
import { flushDb } from '../server/db.mjs'

// One Vercel Function serves every /api route so Fluid compute can reuse instances.
const appPromise = createApp({ serveStatic: false })

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  let app
  try {
    app = await appPromise
  } catch (error) {
    console.error('[api] Failed to initialise the application:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'সার্ভার চালু করা যায়নি।' }))
    return
  }

  // Vercel's generated route for this function only matches a single path
  // segment, so vercel.json rewrites every /api/* request here with the rest of
  // the path in __proxyPath. Rebuild the original URL for Express.
  const incoming = new URL(req.url, 'http://localhost')
  const proxyPath = incoming.searchParams.get('__proxyPath')
  if (proxyPath !== null) {
    incoming.searchParams.delete('__proxyPath')
    const search = incoming.searchParams.toString()
    req.url = `/api/${proxyPath}${search ? `?${search}` : ''}`
  } else if (!req.url.startsWith('/api')) {
    // Vercel can hand the function a path-relative URL depending on routing.
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`
  }

  // Persist queued writes before the response is flushed, so a serverless
  // instance can be recycled immediately after responding without data loss.
  const end = res.end.bind(res)
  let ended = false
  res.end = (...args) => {
    if (ended) return res
    ended = true
    flushDb()
      .catch((error) => console.error('[api] Failed to flush storage before response:', error))
      .finally(() => end(...args))
    return res
  }

  app(req, res)
}
