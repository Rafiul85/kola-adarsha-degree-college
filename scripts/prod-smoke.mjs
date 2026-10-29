/**
 * Production smoke test: serves dist/ with the Express production server on an
 * isolated port and disposable data directory, then checks direct route
 * refreshes, static asset caching, API health, CSP and 404 handling.
 *
 * Usage: npm run build && npm run test:prod
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testDataDir = path.join(rootDir, '.prod-test-data')
const distDir = path.join(rootDir, 'dist')
const port = Number(process.env.TEST_PROD_PORT || 3200)
const base = `http://127.0.0.1:${port}`
const email = 'prod-smoke-admin@example.test'
const password = 'ProdSmoke!Admin2026'

let passed = 0
let failed = 0
const failures = []

function check(condition, label, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  PASS  ${label}`)
  } else {
    failed += 1
    failures.push(label)
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function get(pathname) {
  const response = await fetch(`${base}${pathname}`, { redirect: 'manual' })
  const text = await response.text()
  return { status: response.status, text, headers: response.headers }
}

async function waitForServer() {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/api/health`)
      if (response.ok) return true
    } catch {
      // Still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

async function run() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('dist/index.html is missing. Run `npm run build` first.')
    process.exitCode = 1
    return
  }

  fs.rmSync(testDataDir, { recursive: true, force: true })
  console.log(`\nStarting production smoke server on ${base}\n`)

  const child = spawn(process.execPath, ['server/index.mjs', '--prod'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: '.prod-test-data',
      ADMIN_EMAIL: email,
      ADMIN_PASSWORD: password,
      ADMIN_NAME: 'Production Smoke Administrator',
      APP_ORIGIN: base,
      COOKIE_SECURE: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let serverLog = ''
  child.stdout.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  child.stderr.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  const exited = new Promise((resolve) => child.once('exit', resolve))

  try {
    const ready = await waitForServer()
    check(ready, 'production server starts', serverLog.slice(-500))
    if (!ready) throw new Error('Production server did not start.')

    const health = await get('/api/health')
    check(health.status === 200, 'GET /api/health is served')
    check(health.text.includes('"environment":"production"'), 'health reports production environment')

    const csp = health.headers.get('content-security-policy') || ''
    check(csp.includes("default-src 'self'"), 'production CSP is present')
    check(csp.includes("frame-ancestors 'none'"), 'CSP blocks framing')
    check(health.headers.get('x-content-type-options') === 'nosniff', 'nosniff header is present')
    check(health.headers.get('x-frame-options') === 'DENY', 'X-Frame-Options is DENY')

    for (const route of ['/', '/about', '/teachers', '/students', '/results', '/academics', '/admission', '/notices', '/events', '/contact', '/faq', '/privacy', '/terms', '/login', '/dashboard', '/dashboard/audit']) {
      const response = await get(route)
      check(response.status === 200, `direct refresh ${route} serves the SPA shell`)
      check(
        response.text.includes('<div id="root"></div>'),
        `direct refresh ${route} returns index.html`,
      )
    }

    const index = await get('/')
    check(
      (index.headers.get('cache-control') || '').includes('no-store'),
      'SPA shell is not cached',
    )

    const assetMatch = /src="(\/assets\/[^"]+\.js)"/.exec(index.text)
    check(Boolean(assetMatch), 'index.html references a hashed JavaScript asset')
    if (assetMatch) {
      const asset = await get(assetMatch[1])
      check(asset.status === 200, 'hashed asset is served')
      check(
        (asset.headers.get('cache-control') || '').includes('immutable'),
        'hashed asset is cached immutably',
      )
    }

    const robots = await get('/robots.txt')
    check(robots.status === 200, 'robots.txt is served')
    check(robots.text.includes('Disallow: /dashboard'), 'robots.txt disallows the dashboard')

    const favicon = await get('/favicon.svg')
    check(favicon.status === 200, 'favicon is served')

    const unknownApi = await get('/api/not-real')
    check(unknownApi.status === 404, 'unknown API route returns HTTP 404')
    check(
      (unknownApi.headers.get('content-type') || '').includes('application/json'),
      'unknown API route returns JSON',
    )

    const unknownPage = await get('/this-page-does-not-exist')
    check(unknownPage.status === 200, 'SPA fallback serves the client-side not-found page')
    check(unknownPage.text.includes('<div id="root"></div>'), 'client 404 route receives index.html')
  } finally {
    child.kill()
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))])
    fs.rmSync(testDataDir, { recursive: true, force: true })
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed) {
    console.log('\nFailed checks:')
    for (const label of failures) console.log(` - ${label}`)
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error('\nProduction smoke test crashed:', error)
  fs.rmSync(testDataDir, { recursive: true, force: true })
  process.exitCode = 1
})
