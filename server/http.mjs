import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(status, message, code = '', details = null) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

export function parsePagination(query, defaultSize = 12, maxSize = 100) {
  const page = Math.max(1, Math.min(10000, Number.parseInt(String(query.page || '1'), 10) || 1))
  const pageSize = Math.max(
    1,
    Math.min(maxSize, Number.parseInt(String(query.pageSize || defaultSize), 10) || defaultSize),
  )
  return { page, pageSize, offset: (page - 1) * pageSize }
}

export function parseBody(schema, body) {
  const result = schema.safeParse(body)
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    throw new HttpError(400, details[0]?.message || 'প্রদত্ত তথ্য সঠিক নয়।', 'VALIDATION_ERROR', details)
  }
  return result.data
}

export function errorHandler(error, req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: error.issues[0]?.message || 'প্রদত্ত তথ্য সঠিক নয়।' })
  }
  if (error instanceof HttpError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code || undefined,
      details: error.details || undefined,
    })
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'অনুরোধের তথ্য সঠিক JSON নয়।' })
  }
  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'ফাইলের আকার ৮ মেগাবাইটের বেশি হতে পারবে না।' })
  }
  console.error('[server]', error)
  return res.status(500).json({ error: 'সার্ভারে একটি অপ্রত্যাশিত সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।' })
}

export function attachmentDisposition(filename = 'document') {
  const name = String(filename || 'document').replace(/[\r\n"]/g, '').slice(0, 200)
  const ascii = name.replace(/[^\x20-\x7e]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}

export function apiNotFound(req, res) {
  res.status(404).json({ error: 'অনুরোধকৃত API পাওয়া যায়নি।', code: 'NOT_FOUND' })
}
