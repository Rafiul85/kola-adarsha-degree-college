/**
 * Optional browser smoke test using the locally installed Chrome/Edge and the
 * Chrome DevTools Protocol. No Playwright/Puppeteer dependency is required.
 *
 * It starts an isolated production server, opens the public pages at mobile,
 * tablet and desktop widths, signs in with a throwaway test administrator, opens
 * every dashboard page, and reports console errors, failed root rendering and
 * horizontal overflow.
 *
 * Usage:
 *   npm run build
 *   npm run test:ui
 * Set CHROME_PATH if Chrome/Edge is installed somewhere else.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(rootDir, 'dist')
const testDataDir = path.join(rootDir, '.ui-test-data')
const profileDir = path.join(rootDir, '.ui-test-profile')
const appPort = Number(process.env.TEST_UI_PORT || 3201)
const debugPort = Number(process.env.TEST_UI_DEBUG_PORT || 9333)
const base = `http://127.0.0.1:${appPort}`
const adminEmail = 'ui-smoke-admin@example.test'
const adminPassword = 'UiSmoke!Admin2026'

const publicRoutes = [
  ['/', 'কোলা আদর্শ ডিগ্রি কলেজ'],
  ['/about', 'কলেজ সম্পর্কে'],
  ['/teachers', 'শিক্ষক'],
  ['/students', 'শিক্ষার্থী'],
  ['/results', 'ফলাফল'],
  ['/academics', 'একাডেমিক'],
  ['/admission', 'ভর্তি'],
  ['/notices', 'নোটিশ'],
  ['/events', 'ইভেন্ট'],
  ['/contact', 'যোগাযোগ'],
  ['/faq', 'সাধারণ প্রশ্ন ও উত্তর'],
  ['/privacy', 'গোপনীয়তা'],
  ['/terms', 'শর্তাবলি'],
  ['/login', 'সাইন ইন'],
]

const dashboardRoutes = [
  ['/dashboard', 'ড্যাশবোর্ড'],
  ['/dashboard/notices', 'নোটিশ'],
  ['/dashboard/events', 'ইভেন্ট'],
  ['/dashboard/teachers', 'শিক্ষক'],
  ['/dashboard/students', 'শিক্ষার্থী'],
  ['/dashboard/results', 'ফলাফল'],
  ['/dashboard/academics', 'একাডেমিক'],
  ['/dashboard/documents', 'ডকুমেন্ট'],
  ['/dashboard/messages', 'বার্তা'],
  ['/dashboard/users', 'ব্যবহারকারী'],
  ['/dashboard/settings', 'সেটিংস'],
  ['/dashboard/audit', 'অডিট'],
]

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

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean)
  return candidates.find((candidate) => fs.existsSync(candidate)) || ''
}

async function waitFor(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {
      // Not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

class Cdp {
  constructor(url) {
    this.url = url
    this.id = 0
    this.pending = new Map()
    this.listeners = new Set()
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)
      this.ws.onopen = () => resolve()
      this.ws.onerror = (event) => reject(new Error(`CDP socket error: ${event.message || 'unknown'}`))
      this.ws.onmessage = (event) => {
        let message
        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }
        if (message.id && this.pending.has(message.id)) {
          const { resolve: finish, reject: fail } = this.pending.get(message.id)
          this.pending.delete(message.id)
          if (message.error) fail(new Error(message.error.message))
          else finish(message.result)
          return
        }
        for (const listener of this.listeners) {
          if (listener.method === message.method) listener.resolve(message.params)
        }
      }
    })
  }

  send(method, params = {}) {
    const id = ++this.id
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  waitEvent(method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const listener = {
        method,
        resolve: (params) => {
          this.listeners.delete(listener)
          clearTimeout(timer)
          resolve(params)
        },
      }
      const timer = setTimeout(() => {
        this.listeners.delete(listener)
        reject(new Error(`Timed out waiting for ${method}`))
      }, timeoutMs)
      this.listeners.add(listener)
    })
  }

  close() {
    try {
      this.ws?.close()
    } catch {
      // Ignore.
    }
  }
}

async function main() {
  if (!fs.existsSync(path.join(distDir, 'index.html'))) {
    console.error('dist/index.html is missing. Run `npm run build` first.')
    process.exitCode = 1
    return
  }

  const chromePath = findChrome()
  if (!chromePath) {
    console.error('Chrome/Edge was not found. Set CHROME_PATH and retry.')
    process.exitCode = 1
    return
  }

  fs.rmSync(testDataDir, { recursive: true, force: true })
  fs.rmSync(profileDir, { recursive: true, force: true })

  console.log(`\nStarting isolated production server on ${base}\n`)

  const server = spawn(process.execPath, ['server/index.mjs', '--prod'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(appPort),
      DATA_DIR: '.ui-test-data',
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      ADMIN_NAME: 'UI Smoke Administrator',
      APP_ORIGIN: base,
      COOKIE_SECURE: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let serverLog = ''
  server.stdout.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  server.stderr.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  const serverExited = new Promise((resolve) => server.once('exit', resolve))

  let chrome
  let cdp
  try {
    const appReady = await waitFor(`${base}/api/health`)
    check(appReady, 'isolated production server starts', serverLog.slice(-500))
    if (!appReady) throw new Error('Production server did not start.')

    chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--hide-scrollbars',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${profileDir}`,
        'about:blank',
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    )
    let chromeLog = ''
    chrome.stderr.on('data', (chunk) => {
      chromeLog += chunk.toString()
    })
    const chromeExited = new Promise((resolve) => chrome.once('exit', resolve))

    const debugReady = await waitFor(`http://127.0.0.1:${debugPort}/json/version`)
    check(debugReady, 'headless browser starts', chromeLog.slice(-500))
    if (!debugReady) throw new Error('Chrome DevTools endpoint did not start.')

    const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
    const target = list.find((item) => item.type === 'page')
    check(Boolean(target?.webSocketDebuggerUrl), 'browser page target is available')
    if (!target) throw new Error('No browser page target.')

    cdp = new Cdp(target.webSocketDebuggerUrl)
    await cdp.connect()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    await cdp.send('Log.enable')
    await cdp.send('Network.enable')

    let consoleErrors = []
    cdp.listeners.add({
      method: 'Runtime.consoleAPICalled',
      resolve: (params) => {
        if (params.type !== 'error') return
        const text = (params.args || [])
          .map((arg) => arg.value ?? arg.description ?? arg.type)
          .join(' ')
        if (text) consoleErrors.push(text.slice(0, 300))
      },
    })
    cdp.listeners.add({
      method: 'Runtime.exceptionThrown',
      resolve: (params) => {
        const details = params.exceptionDetails || {}
        consoleErrors.push(
          `${details.text || 'Exception'} ${details.exception?.description || ''}`.trim().slice(0, 300),
        )
      },
    })
    cdp.listeners.add({
      method: 'Log.entryAdded',
      resolve: (params) => {
        const entry = params.entry || {}
        if (entry.level === 'error') consoleErrors.push(String(entry.text || '').slice(0, 300))
      },
    })

    async function evaluate(expression) {
      const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      })
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text || 'Evaluation failed')
      }
      return result.result?.value
    }

    async function open(route, width, height) {
      consoleErrors = []
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      })
      const loaded = cdp.waitEvent('Page.loadEventFired').catch(() => null)
      await cdp.send('Page.navigate', { url: `${base}${route}` })
      await loaded
      const deadline = Date.now() + 10000
      let snapshot = null
      while (Date.now() < deadline) {
        snapshot = await evaluate(`(() => {
          const root = document.getElementById('root');
          const h1 = document.querySelectorAll('h1');
          return {
            title: document.title,
            lang: document.documentElement.lang,
            rootChildren: root ? root.children.length : 0,
            h1Count: h1.length,
            h1Text: h1[0] ? h1[0].innerText.trim().slice(0, 80) : '',
            bodyText: document.body.innerText.slice(0, 200),
            overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            href: location.pathname,
            theme: document.documentElement.dataset.theme || ''
          };
        })()`)
        if (snapshot.rootChildren > 0 && snapshot.h1Count > 0) break
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      await new Promise((resolve) => setTimeout(resolve, 450))
      const finalSnapshot = await evaluate(`(() => {
        const root = document.getElementById('root');
        return {
          title: document.title,
          rootChildren: root ? root.children.length : 0,
          bodyText: document.body.innerText.slice(0, 200),
          overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
          href: location.pathname,
          hasLoading: document.body.innerText.includes('লোড হচ্ছে…')
        };
      })()`)
      return { ...snapshot, ...finalSnapshot, consoleErrors: [...consoleErrors] }
    }

    function inspect(route, label, result) {
      check(result.rootChildren > 0, `${label} renders the React root`)
      check(Boolean(result.title), `${label} has a document title`)
      check(result.lang === 'bn', `${label} declares Bangla language`)
      check(result.bodyText.trim().length > 80, `${label} renders visible content`)
      check(result.overflow <= 2, `${label} has no horizontal page overflow`, `${result.overflow}px`)
      check(result.consoleErrors.length === 0, `${label} has no console errors`, result.consoleErrors.join(' | '))
    }

    console.log('Public pages — desktop 1280×900')
    for (const [route, expected] of publicRoutes) {
      const result = await open(route, 1280, 900)
      inspect(route, route, result)
      check(
        result.bodyText.includes(expected) || result.title.includes(expected),
        `${route} shows expected Bangla content`,
        `expected “${expected}”`,
      )
    }

    console.log('\nPublic pages — mobile 360×800')
    for (const route of ['/', '/teachers', '/results', '/academics', '/contact', '/login']) {
      const result = await open(route, 360, 800)
      inspect(route, `${route} @360`, result)
    }

    console.log('\nPublic pages — tablet 768×1024')
    for (const route of ['/', '/teachers', '/notices']) {
      const result = await open(route, 768, 1024)
      inspect(route, `${route} @768`, result)
    }

    console.log('\nAdmin sign-in')
    const loginResponse = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    })
    check(loginResponse.status === 200, 'test administrator signs in through the API')
    const setCookie = loginResponse.headers.getSetCookie?.() || []
    const cookieMatch = setCookie.map((value) => /kadc_session=([^;]+)/.exec(value)).find(Boolean)
    check(Boolean(cookieMatch), 'session cookie is issued')
    if (!cookieMatch) throw new Error('No session cookie for dashboard test.')
    await cdp.send('Network.setCookie', {
      name: 'kadc_session',
      value: cookieMatch[1],
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    })

    console.log('\nDashboard — desktop 1280×900')
    for (const [route, expected] of dashboardRoutes) {
      const result = await open(route, 1280, 900)
      inspect(route, route, result)
      check(
        result.bodyText.includes(expected) || result.title.includes(expected),
        `${route} shows expected dashboard content`,
        `expected “${expected}”`,
      )
    }

    console.log('\nDashboard — mobile 360×800')
    for (const route of ['/dashboard', '/dashboard/results', '/dashboard/settings', '/dashboard/audit']) {
      const result = await open(route, 360, 800)
      inspect(route, `${route} @360`, result)
    }

    console.log('\nTheme and navigation')
    await open('/', 1280, 900)
    const themeResult = await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) =>
        /থিম|theme/i.test(item.getAttribute('aria-label') || item.innerText || '')
      );
      if (button) button.click();
      return { found: Boolean(button), theme: document.documentElement.dataset.theme || '' };
    })()`)
    check(themeResult.found, 'theme toggle is present')
    check(themeResult.theme === 'dark' || themeResult.theme === 'light', 'theme toggle sets a theme')

    const mobileNav = await open('/', 360, 800)
    const menuResult = await evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((item) =>
        /মেনু|menu/i.test(item.getAttribute('aria-label') || item.innerText || '')
      );
      return { found: Boolean(button) };
    })()`)
    check(menuResult.found, 'mobile menu button is present')
    check(mobileNav.rootChildren > 0, 'mobile home page renders after navigation test')
  } finally {
    cdp?.close()
    if (chrome) {
      chrome.kill()
      await Promise.race([
        new Promise((resolve) => chrome.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])
    }
    server.kill()
    await Promise.race([serverExited, new Promise((resolve) => setTimeout(resolve, 5000))])
    for (const dir of [testDataDir, profileDir]) {
      try {
        fs.rmSync(dir, { recursive: true, force: true })
      } catch {
        // Chrome may briefly retain a profile lock; leave it for the next run.
      }
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed) {
    console.log('\nFailed checks:')
    for (const label of failures) console.log(` - ${label}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('\nUI smoke test crashed:', error)
  fs.rmSync(testDataDir, { recursive: true, force: true })
  process.exitCode = 1
})
