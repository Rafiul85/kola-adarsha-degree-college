import express from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { getDb, saveDb, audit, publicUser } from '../db.mjs'
import {
  attachUser,
  createPasswordReset,
  createSession,
  destroyAllUserSessions,
  destroySession,
  hashPassword,
  passwordProblem,
  rateLimit,
  requireAuth,
  sha256,
  verifyPassword,
} from '../auth.mjs'
import { asyncHandler, HttpError, parseBody } from '../http.mjs'
import { config } from '../env.mjs'

const router = express.Router()

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল প্রদান করুন।'),
  password: z.string().min(1, 'পাসওয়ার্ড প্রদান করুন।').max(200),
})

router.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 12, keyPrefix: 'login' }),
  asyncHandler(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body)
    const database = getDb()
    const user = database.users.find((item) => item.email === email)
    if (!user || user.status !== 'active' || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।', 'INVALID_CREDENTIALS')
    }
    createSession(req, res, user)
    audit(user, 'auth.login', 'users', user.id, 'Successful sign in.')
    saveDb()
    res.json({ user: publicUser(user), message: 'সফলভাবে সাইন ইন হয়েছে।' })
  }),
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const user = req.user
    destroySession(req, res)
    if (user) audit(user, 'auth.logout', 'users', user.id, 'Signed out.')
    saveDb()
    res.json({ message: 'সাইন আউট সম্পন্ন হয়েছে।' })
  }),
)

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ user: req.user ? publicUser(req.user) : null })
  }),
)

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('সঠিক ইমেইল প্রদান করুন।'),
})

router.post(
  '/forgot-password',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'forgot' }),
  asyncHandler(async (req, res) => {
    const { email } = parseBody(forgotSchema, req.body)
    const database = getDb()
    const user = database.users.find((item) => item.email === email && item.status === 'active')
    let developmentLink = ''
    if (user) {
      const token = createPasswordReset(user.id)
      developmentLink = `${config.appOrigin || `http://localhost:${config.port}`}/reset-password?token=${token}`
      audit(user, 'auth.password_reset_request', 'users', user.id, 'Password reset link created.')
      saveDb()
      if (!config.isProd) {
        console.log(`[password-reset] ${user.email}: ${developmentLink}`)
      }
    }
    res.json({
      message:
        'যদি এই ইমেইলের একটি সক্রিয় অ্যাকাউন্ট থাকে, পাসওয়ার্ড রিসেট করার নির্দেশনা তৈরি করা হয়েছে। ইমেইল সেবা কনফিগার না থাকলে কলেজ প্রশাসন আপনাকে নিরাপদভাবে লিংকটি দিতে পারবে।',
    })
  }),
)

function findResetToken(rawToken) {
  const database = getDb()
  const hash = sha256(String(rawToken || ''))
  const token = database.resetTokens.find((item) => item.tokenHash === hash)
  if (!token || token.usedAt || new Date(token.expiresAt).getTime() <= Date.now()) return null
  const user = database.users.find((item) => item.id === token.userId && item.status === 'active')
  return user ? { token, user } : null
}

function maskEmail(email) {
  const [name, domain] = String(email).split('@')
  if (!domain) return ''
  const visible = name.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(1, name.length - visible.length))}@${domain}`
}

router.get(
  '/reset-password/:token',
  asyncHandler(async (req, res) => {
    const found = findResetToken(req.params.token)
    if (!found) {
      throw new HttpError(400, 'এই পাসওয়ার্ড রিসেট লিংকটি বৈধ নয় বা মেয়াদ শেষ হয়েছে।', 'INVALID_RESET')
    }
    res.json({ valid: true, email: maskEmail(found.user.email) })
  }),
)

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(1).max(200),
})

router.post(
  '/reset-password',
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: 'reset' }),
  asyncHandler(async (req, res) => {
    const { token, password } = parseBody(resetSchema, req.body)
    const problem = passwordProblem(password)
    if (problem) throw new HttpError(400, problem, 'WEAK_PASSWORD')
    const found = findResetToken(token)
    if (!found) {
      throw new HttpError(400, 'এই পাসওয়ার্ড রিসেট লিংকটি বৈধ নয় বা মেয়াদ শেষ হয়েছে।', 'INVALID_RESET')
    }
    found.token.usedAt = new Date().toISOString()
    found.user.passwordHash = hashPassword(password)
    found.user.mustChangePassword = false
    found.user.updatedAt = new Date().toISOString()
    destroyAllUserSessions(found.user.id)
    audit(found.user, 'auth.password_reset', 'users', found.user.id, 'Password reset completed.')
    saveDb()
    res.json({ message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। নতুন পাসওয়ার্ড দিয়ে সাইন ইন করুন।' })
  }),
)

const changeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(1).max(200),
})

router.post(
  '/change-password',
  requireAuth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 8, keyPrefix: 'change-password' }),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = parseBody(changeSchema, req.body)
    if (!verifyPassword(currentPassword, req.user.passwordHash)) {
      throw new HttpError(400, 'বর্তমান পাসওয়ার্ড সঠিক নয়।', 'INVALID_PASSWORD')
    }
    const problem = passwordProblem(newPassword)
    if (problem) throw new HttpError(400, problem, 'WEAK_PASSWORD')
    const database = getDb()
    const currentSessionId = req.sessionId
    req.user.passwordHash = hashPassword(newPassword)
    req.user.mustChangePassword = false
    req.user.updatedAt = new Date().toISOString()
    database.sessions = database.sessions.filter(
      (session) => session.userId !== req.user.id || session.id === currentSessionId,
    )
    audit(req.user, 'auth.password_change', 'users', req.user.id, 'Password changed by the account owner.')
    saveDb()
    res.json({ message: 'পাসওয়ার্ড পরিবর্তন হয়েছে। অন্যান্য ডিভাইস থেকে সেশন বন্ধ করা হয়েছে।' })
  }),
)

// Kept as a token helper for future integrations; it never exposes hashes.
export function generateToken() {
  return crypto.randomBytes(24).toString('base64url')
}

export { attachUser }
export default router
