/**
 * End-to-end API smoke test.
 *
 * Runs the Express server against a disposable data directory (`.test-data`) on
 * an isolated port so it never touches `server/data/db.json`. The test covers
 * authentication, role enforcement, result privacy, CSV import validation,
 * contact messages, audit logs and backups.
 *
 * Usage: npm run test:api
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testDataDir = path.join(rootDir, '.test-data')
const port = Number(process.env.TEST_PORT || 3199)
const base = `http://127.0.0.1:${port}`
const adminEmail = 'api-test-admin@example.test'
const adminPassword = 'ApiTest!Admin2026'
const teacherEmail = 'api-test-teacher@example.test'
const teacherPassword = 'ApiTest!Teacher2026'

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

function cookieFrom(response) {
  const values =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie') || '']
  for (const value of values) {
    const match = /(?:^|,\s*)kadc_session=([^;]+)/.exec(value)
    if (match) return `kadc_session=${match[1]}`
  }
  return ''
}

async function request(pathname, { method = 'GET', body, cookie = '', raw = false } = {}) {
  const headers = {}
  if (cookie) headers.cookie = cookie
  if (body !== undefined) headers['content-type'] = 'application/json'
  const response = await fetch(`${base}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual',
  })
  const text = await response.text()
  let data = null
  if (!raw) {
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = { raw: text }
    }
  }
  return {
    status: response.status,
    data,
    text,
    cookie: cookieFrom(response),
    contentType: response.headers.get('content-type') || '',
    cacheControl: response.headers.get('cache-control') || '',
    headers: response.headers,
  }
}

async function waitForServer() {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/api/health`)
      if (response.ok) return true
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  return false
}

async function run() {
  console.log(`\nStarting isolated test server on ${base}\n`)

  fs.rmSync(testDataDir, { recursive: true, force: true })

  const child = spawn(process.execPath, ['server/index.mjs'], {
    cwd: rootDir,
    env: {
      ...process.env,
      PORT: String(port),
      DATA_DIR: '.test-data',
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASSWORD: adminPassword,
      ADMIN_NAME: 'API Test Administrator',
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
    check(ready, 'server starts and reports healthy', serverLog.slice(-400))
    if (!ready) throw new Error('Test server did not start.')

    console.log('\nPublic access')
    const health = await request('/api/health')
    check(health.status === 200 && health.data?.ok === true, 'GET /api/health returns ok')

    const settings = await request('/api/public/settings')
    check(settings.status === 200, 'GET /api/public/settings is public')
    check(
      settings.data?.settings?.institution?.eiin === '123139',
      'institution EIIN is 123139',
      JSON.stringify(settings.data?.settings?.institution?.eiin),
    )
    check(
      typeof settings.data?.meta?.demoContentNotice === 'string' &&
        settings.data.meta.demoContentNotice.length > 0,
      'sample-content disclosure is returned',
    )

    const home = await request('/api/public/home')
    check(home.status === 200 && Array.isArray(home.data?.notices), 'GET /api/public/home returns notices')
    check(
      home.data?.counts?.activeTeachers === 0,
      'no teacher records are invented in seed data',
      String(home.data?.counts?.activeTeachers),
    )

    const publicMessages = await request('/api/public/messages')
    check(publicMessages.status === 404, 'contact messages are not exposed publicly')

    console.log('\nAuthentication and roles')
    const unauthenticated = await request('/api/dashboard/admin')
    check(unauthenticated.status === 401, 'dashboard requires authentication')

    const wrongLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: 'definitely-wrong-password' },
    })
    check(wrongLogin.status === 401, 'wrong password is rejected')
    check(!wrongLogin.cookie, 'failed login issues no session cookie')

    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword },
    })
    check(adminLogin.status === 200, 'seeded administrator can sign in')
    check(adminLogin.data?.user?.role === 'admin', 'signed-in role is admin')
    check(adminLogin.cacheControl.includes('no-store'), 'authentication responses are not cacheable')
    check(
      adminLogin.headers.get('x-content-type-options') === 'nosniff',
      'security headers include nosniff',
    )
    const adminCookie = adminLogin.cookie
    check(Boolean(adminCookie), 'session cookie is set')

    const me = await request('/api/auth/me', { cookie: adminCookie })
    check(me.status === 200 && me.data?.user?.email === adminEmail, 'GET /api/auth/me returns the session user')
    check(
      me.data?.user && !('passwordHash' in me.data.user),
      'password hash is never returned to the browser',
    )

    const adminDashboard = await request('/api/dashboard/admin', { cookie: adminCookie })
    check(adminDashboard.status === 200, 'admin dashboard payload loads')
    check(
      adminDashboard.data?.stats?.demo?.notices > 0,
      'demo notices are counted in the admin dashboard',
    )

    const teacherCreate = await request('/api/admin/teachers', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'API পরীক্ষা শিক্ষক',
        designation: 'প্রভাষক (পরীক্ষা)',
        department: 'পরীক্ষা বিভাগ',
        status: 'active',
      },
    })
    check(teacherCreate.status === 201, 'admin can create a teacher record')
    const teacherId = teacherCreate.data?.item?.id
    check(Boolean(teacherId), 'created teacher has an id')

    const teacherUser = await request('/api/admin/users', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        displayName: 'API পরীক্ষা শিক্ষক',
        email: teacherEmail,
        role: 'teacher',
        status: 'active',
        linkedId: teacherId,
        password: teacherPassword,
      },
    })
    check(teacherUser.status === 201, 'admin can provision a linked teacher account')
    const teacherUserId = teacherUser.data?.item?.id

    const adminAttempt = await request('/api/admin/users', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        displayName: 'Should Not Exist',
        email: 'no-self-promotion@example.test',
        role: 'admin',
        status: 'active',
        password: 'NoPromotion!2026',
      },
    })
    check(adminAttempt.status === 201, 'administrator can create another administrator explicitly')

    const teacherLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: teacherEmail, password: teacherPassword },
    })
    check(teacherLogin.status === 200, 'teacher account can sign in')
    check(teacherLogin.data?.user?.role === 'teacher', 'teacher role is enforced from the server record')
    const teacherCookie = teacherLogin.cookie

    const teacherDashboard = await request('/api/dashboard/teacher', { cookie: teacherCookie })
    check(teacherDashboard.status === 200, 'teacher dashboard payload loads')

    const teacherAdminRead = await request('/api/admin/notices', { cookie: teacherCookie })
    check(teacherAdminRead.status === 403, 'teacher cannot read admin CMS endpoints')

    const teacherPromote = await request(`/api/admin/users/${teacherUserId}`, {
      method: 'PUT',
      cookie: teacherCookie,
      body: {
        displayName: 'API পরীক্ষা শিক্ষক',
        email: teacherEmail,
        role: 'admin',
        status: 'active',
        linkedId: teacherId,
      },
    })
    check(teacherPromote.status === 403, 'teacher cannot promote themselves through user management')

    const teacherManageNotices = await request('/api/admin/notices', {
      method: 'POST',
      cookie: teacherCookie,
      body: { title: 'Unauthorised notice', category: 'সাধারণ', summary: '', body: '', status: 'draft' },
    })
    check(teacherManageNotices.status === 403, 'teacher cannot create notices')

    console.log('\nResults portal privacy')
    const academics = await request('/api/public/academics')
    check(academics.status === 200, 'academics payload is public')
    const sessions = academics.data?.sessions || []
    const programs = academics.data?.programs || []
    check(sessions.length > 0 && programs.length > 0, 'academic sessions and programmes exist')

    const examCreate = await request('/api/admin/examinations', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'API পরীক্ষা ২০২৬',
        sessionId: sessions[0].id,
        programId: programs[0].id,
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        status: 'published',
      },
    })
    check(examCreate.status === 201, 'admin can create a published examination')
    const examId = examCreate.data?.item?.id

    const resultCreate = await request('/api/admin/results', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        examinationId: examId,
        roll: 'API-1001',
        registration: 'API-REG-1001',
        studentName: 'এপিআই পরীক্ষার্থী',
        gpa: 4.5,
        outcome: 'pass',
        subjects: [{ name: 'বাংলা', marks: 80 }],
        status: 'draft',
      },
    })
    check(resultCreate.status === 201, 'admin can add a draft result')
    const resultId = resultCreate.data?.item?.id
    check(resultCreate.data?.item?.status === 'draft', 'new result remains a draft')

    const draftSearch = await request('/api/public/results/search', {
      method: 'POST',
      body: { examinationId: examId, roll: 'API-1001', registration: 'API-REG-1001' },
    })
    check(draftSearch.status === 404, 'unpublished result is not searchable publicly')

    const metaBeforePublish = await request('/api/public/results-meta')
    check(
      metaBeforePublish.data?.totalPublishedResults === 0,
      'results-meta counts only published results',
      String(metaBeforePublish.data?.totalPublishedResults),
    )

    const validate = await request('/api/admin/results/validate', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        examinationId: examId,
        records: [
          {
            roll: 'API-1002',
            registration: 'API-REG-1002',
            studentName: 'আমদানি পরীক্ষার্থী',
            gpa: 4.25,
            outcome: 'pass',
            subjects: [{ name: 'বাংলা', marks: 75 }],
          },
          {
            roll: 'API-1001',
            registration: 'API-REG-1001',
            studentName: 'এপিআই পরীক্ষার্থী',
            gpa: 4.6,
            outcome: 'pass',
          },
          {
            roll: 'API-1002',
            registration: 'API-REG-1002-OTHER',
            studentName: 'ডুপ্লিকেট সারি',
            outcome: 'pass',
          },
          { roll: '', registration: '', studentName: 'অ', gpa: 9, outcome: 'unknown' },
        ],
      },
    })
    check(validate.status === 200, 'CSV records can be validated before import')
    check(validate.data?.duplicateCount === 1, 'existing result is detected as a duplicate')
    check(validate.data?.errorCount >= 1, 'invalid import rows are reported')
    check(
      (validate.data?.rows || []).some((row) => row.errors.some((error) => error.includes('একই ফাইলে'))),
      'duplicate roll inside the import file is rejected',
    )

    const importSkip = await request('/api/admin/results/import', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        examinationId: examId,
        mode: 'skip',
        records: [
          {
            roll: 'API-1001',
            registration: 'API-REG-1001',
            studentName: 'এপিআই পরীক্ষার্থী',
            gpa: 4.6,
            outcome: 'pass',
          },
        ],
      },
    })
    check(importSkip.status === 200, 'duplicate-only import can be skipped safely')
    check(importSkip.data?.skipped === 1, 'skip mode leaves the existing result unchanged')

    const overwriteWithoutConfirm = await request('/api/admin/results/import', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        examinationId: examId,
        mode: 'overwrite',
        records: [
          {
            roll: 'API-1001',
            registration: 'API-REG-1001',
            studentName: 'এপিআই পরীক্ষার্থী',
            gpa: 4.75,
            outcome: 'pass',
          },
        ],
      },
    })
    check(
      overwriteWithoutConfirm.status === 409,
      'overwriting existing results requires explicit confirmation',
    )

    const publish = await request(`/api/admin/results/${resultId}/status`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { status: 'published' },
    })
    check(publish.status === 200, 'admin can publish a result')

    const publishedSearch = await request('/api/public/results/search', {
      method: 'POST',
      body: { examinationId: examId, roll: 'api-1001', registration: 'api-reg-1001' },
    })
    check(publishedSearch.status === 200, 'published result is searchable with correct credentials')
    check(publishedSearch.cacheControl.includes('no-store'), 'personal result responses are not cacheable')
    check(
      publishedSearch.data?.result?.studentName === 'এপিআই পরীক্ষার্থী',
      'search returns the matching result',
    )
    check(publishedSearch.data?.result?.unofficial === true, 'result is labelled unofficial')

    const wrongRegistration = await request('/api/public/results/search', {
      method: 'POST',
      body: { examinationId: examId, roll: 'API-1001', registration: 'WRONG-REGISTRATION' },
    })
    check(wrongRegistration.status === 404, 'wrong registration is rejected')
    check(
      wrongRegistration.data?.error ===
        'প্রদত্ত তথ্যের সাথে মিলে এমন কোনো প্রকাশিত ফলাফল পাওয়া যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।',
      'wrong-credential response is generic and does not disclose record existence',
    )

    const metaAfterPublish = await request('/api/public/results-meta')
    check(
      metaAfterPublish.data?.totalPublishedResults === 1,
      'published result is counted in results-meta',
      String(metaAfterPublish.data?.totalPublishedResults),
    )

    console.log('\nContent, messages, audit and backups')
    const contact = await request('/api/public/contact', {
      method: 'POST',
      body: {
        name: 'API যোগাযোগ',
        email: 'api-contact@example.test',
        phone: '01700000000',
        subject: 'API পরীক্ষার বার্তা',
        message: 'এটি স্বয়ংক্রিয় API পরীক্ষার একটি বার্তা, প্রকৃত ব্যবহারকারীর নয়।',
      },
    })
    check(contact.status === 201, 'contact form accepts a valid message')

    const messages = await request('/api/admin/messages', { cookie: adminCookie })
    check(messages.status === 200, 'admin can read contact messages')
    const message = (messages.data?.items || []).find((item) => item.email === 'api-contact@example.test')
    check(Boolean(message), 'submitted contact message is stored')
    check(message?.ip !== undefined, 'message metadata is retained for administrators only')

    const audit = await request('/api/admin/audit-logs?limit=100', { cookie: adminCookie })
    check(audit.status === 200, 'admin can read the audit log')
    const actions = (audit.data?.items || []).map((item) => item.action)
    check(actions.includes('auth.login'), 'sign-ins are audited')
    check(actions.includes('results.import'), 'result imports are audited')
    check(actions.includes('results.status'), 'result publication is audited')
    check(actions.includes('user.create'), 'user provisioning is audited')

    const backupCreate = await request('/api/admin/backups', {
      method: 'POST',
      cookie: adminCookie,
    })
    check(backupCreate.status === 201, 'admin can create a backup')
    const backupFile = backupCreate.data?.backup
    check(Boolean(backupFile), 'backup file name is returned')
    const backupList = await request('/api/admin/backups', { cookie: adminCookie })
    check(
      (backupList.data?.items || []).length > 0,
      'backup list includes the new backup',
    )
    if (backupFile) {
      const download = await request(`/api/admin/backups/${encodeURIComponent(backupFile)}`, {
        cookie: adminCookie,
        raw: true,
      })
      check(download.status === 200, 'administrator can download a backup')
      check(!download.text.includes(adminPassword), 'backup does not contain the plaintext admin password')
    }

    const deleteMessage = await request(`/api/admin/messages/${message?.id}`, {
      method: 'DELETE',
      cookie: adminCookie,
    })
    check(deleteMessage.status === 200, 'admin can delete a contact message')
    check(
      (await request(`/api/admin/messages`, { cookie: adminCookie })).data?.items?.every(
        (item) => item.id !== message?.id,
      ),
      'deleted message is removed from the list',
    )

    const archiveNotice = await request('/api/admin/notices', { cookie: adminCookie })
    const notice = archiveNotice.data?.items?.[0]
    if (notice) {
      const archive = await request(`/api/admin/notices/${notice.id}/status`, {
        method: 'PATCH',
        cookie: adminCookie,
        body: { status: 'archived' },
      })
      check(archive.status === 200, 'admin can archive a notice instead of deleting it')
      const hardDelete = await request(`/api/admin/notices/${notice.id}`, {
        method: 'DELETE',
        cookie: adminCookie,
      })
      check(hardDelete.status === 405, 'notices are not silently hard-deleted')
    }

    console.log('\nSession teardown')
    const logout = await request('/api/auth/logout', { method: 'POST', cookie: teacherCookie })
    check(logout.status === 200, 'teacher can sign out')
    const afterLogout = await request('/api/auth/me', { cookie: teacherCookie })
    check(afterLogout.status === 200 && afterLogout.data?.user === null, 'revoked cookie no longer resolves a user')

    const unknown = await request('/api/does-not-exist')
    check(unknown.status === 404, 'unknown API routes return 404 JSON')
  } finally {
    child.kill()
    await Promise.race([
      exited,
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ])
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
  console.error('\nAPI test crashed:', error)
  fs.rmSync(testDataDir, { recursive: true, force: true })
  process.exitCode = 1
})
