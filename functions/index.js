/**
 * EcoCycle Melbourne - Cloud Functions (Firebase Functions v2, Node 22)
 *
 *  Callable (HTTPS):
 *    initUser      - create profile + assign role custom claim on first sign-in
 *    setUserRole   - admin: promote / demote a user (custom claim + profile)
 *    sendEmail     - admin: single/bulk email with attachments through SendGrid
 *    getAnalytics  - admin: server-side aggregation for the dashboard charts
 *  Firestore triggers:
 *    onRegistrationCreated - confirmation email (with .ics invite) + eco points
 *    onRatingWritten       - keep event rating aggregates up to date + eco points
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore')
const { setGlobalOptions, logger } = require('firebase-functions/v2')
const { defineSecret, defineString } = require('firebase-functions/params')
const admin = require('firebase-admin')
const sgMail = require('@sendgrid/mail')

admin.initializeApp()
const db = admin.firestore()
const { FieldValue } = admin.firestore

setGlobalOptions({ region: 'australia-southeast1', maxInstances: 10 })

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY')
const SENDGRID_FROM = defineString('SENDGRID_FROM', { default: '' })
const ADMIN_EMAILS = defineString('ADMIN_EMAILS', { default: '' })

// ---------------------------------------------------------------- helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BLOCKED_EXT = /\.(exe|bat|cmd|com|scr|js|jse|vbs|msi|jar|ps1|sh|dll|apk)$/i
const MAX_ATTACH_BYTES = 5 * 1024 * 1024

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const requireAuth = (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Please sign in first.')
  return req.auth
}
const requireAdmin = (req) => {
  const auth = requireAuth(req)
  if (auth.token.role !== 'admin') throw new HttpsError('permission-denied', 'Administrator access required.')
  return auth
}

const adminEmailList = () =>
  ADMIN_EMAILS.value().split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

const emailHtml = (heading, innerHtml) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;border:1px solid #dde5df;border-radius:8px;overflow:hidden">
  <div style="background:#146c43;color:#fff;padding:16px 24px;font-size:20px;font-weight:bold">♻️ EcoCycle Melbourne</div>
  <div style="padding:24px;color:#1b2a22;line-height:1.5">
    ${heading ? `<h2 style="margin-top:0">${escapeHtml(heading)}</h2>` : ''}
    ${innerHtml}
  </div>
  <div style="background:#f3f8f5;color:#4b5a52;padding:12px 24px;font-size:12px">You are receiving this because you registered with EcoCycle Melbourne.</div>
</div>`

const sendMail = async (msg) => {
  sgMail.setApiKey(SENDGRID_API_KEY.value())
  const from = SENDGRID_FROM.value()
  if (!from) throw new HttpsError('failed-precondition', 'SENDGRID_FROM is not configured.')
  return sgMail.sendMultiple({ from: { email: from, name: 'EcoCycle Melbourne' }, ...msg })
}

const buildIcs = (ev) => {
  const [y, m, d] = ev.date.split('-').map(Number)
  const [hh, mm] = (ev.time || '09:00').split(':').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (dt) => `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
  const start = new Date(y, m - 1, d, hh, mm)
  const end = new Date(start.getTime() + 2 * 3600 * 1000)
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EcoCycle Melbourne//Events//EN', 'BEGIN:VEVENT',
    `UID:${ev.id}@ecocycle-melbourne`, `DTSTAMP:${fmt(new Date())}`,
    `DTSTART;TZID=Australia/Melbourne:${fmt(start)}`, `DTEND;TZID=Australia/Melbourne:${fmt(end)}`,
    `SUMMARY:${esc(ev.title)}`, `LOCATION:${esc(ev.address || ev.location)}`, `DESCRIPTION:${esc(ev.description)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

const addPoints = async (uid, delta) => {
  const userRef = db.doc(`users/${uid}`)
  const snap = await userRef.get()
  if (!snap.exists) return
  const batch = db.batch()
  batch.update(userRef, { points: FieldValue.increment(delta) })
  batch.set(db.doc(`leaderboard/${uid}`), { displayName: snap.data().displayName || 'Volunteer', points: FieldValue.increment(delta) }, { merge: true })
  await batch.commit()
}

// ---------------------------------------------------------------- callable functions
exports.initUser = onCall(async (req) => {
  const { uid, token } = requireAuth(req)
  const email = (token.email || '').toLowerCase()
  const requestedName = typeof req.data?.displayName === 'string' ? req.data.displayName.trim().slice(0, 80) : ''
  const displayName = requestedName || token.name || email.split('@')[0] || 'Volunteer'

  const ref = db.doc(`users/${uid}`)
  const snap = await ref.get()
  let role = snap.exists ? snap.data().role : 'volunteer'
  // Bootstrap admins by verified email only.
  if (token.email_verified && adminEmailList().includes(email)) role = 'admin'

  if (!snap.exists) {
    await ref.set({ email, displayName, role, points: 0, createdAt: FieldValue.serverTimestamp() })
  } else {
    const patch = {}
    if (requestedName && snap.data().displayName !== requestedName) patch.displayName = requestedName
    if (snap.data().role !== role) patch.role = role
    if (Object.keys(patch).length) await ref.update(patch)
  }
  if (token.role !== role) await admin.auth().setCustomUserClaims(uid, { role })
  return { role }
})

exports.setUserRole = onCall(async (req) => {
  const caller = requireAdmin(req)
  const { uid, role } = req.data || {}
  if (typeof uid !== 'string' || !['admin', 'volunteer'].includes(role)) throw new HttpsError('invalid-argument', 'uid and a valid role are required.')
  if (uid === caller.uid) throw new HttpsError('failed-precondition', 'You cannot change your own role.')
  const ref = db.doc(`users/${uid}`)
  if (!(await ref.get()).exists) throw new HttpsError('not-found', 'User not found.')
  await ref.update({ role })
  await admin.auth().setCustomUserClaims(uid, { role })
  await admin.auth().revokeRefreshTokens(uid) // forces a new token (with the new role) on next sign-in
  return { ok: true }
})

exports.sendEmail = onCall({ secrets: [SENDGRID_API_KEY], timeoutSeconds: 120, memory: '512MiB' }, async (req) => {
  const caller = requireAdmin(req)
  const { to, subject, message, attachments = [] } = req.data || {}

  if (!Array.isArray(to) || !to.length) throw new HttpsError('invalid-argument', 'At least one recipient is required.')
  const recipients = [...new Set(to.map((e) => String(e).trim().toLowerCase()))]
  if (recipients.length > 500) throw new HttpsError('invalid-argument', 'Maximum 500 recipients per send.')
  const bad = recipients.find((e) => !EMAIL_RE.test(e))
  if (bad) throw new HttpsError('invalid-argument', `Invalid email address: ${bad}`)
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 150) throw new HttpsError('invalid-argument', 'Subject must be 1-150 characters.')
  if (typeof message !== 'string' || message.trim().length < 10 || message.length > 10000) throw new HttpsError('invalid-argument', 'Message must be 10-10000 characters.')
  if (!Array.isArray(attachments) || attachments.length > 10) throw new HttpsError('invalid-argument', 'Maximum 10 attachments.')

  let total = 0
  const sgAttachments = attachments.map((a) => {
    if (typeof a?.filename !== 'string' || typeof a?.content !== 'string') throw new HttpsError('invalid-argument', 'Malformed attachment.')
    if (BLOCKED_EXT.test(a.filename)) throw new HttpsError('invalid-argument', `Attachment type not allowed: ${a.filename}`)
    total += Math.floor((a.content.length * 3) / 4)
    return { filename: a.filename.slice(0, 120), content: a.content, type: String(a.type || 'application/octet-stream'), disposition: 'attachment' }
  })
  if (total > MAX_ATTACH_BYTES) throw new HttpsError('invalid-argument', 'Attachments must total 5 MB or less.')

  const html = emailHtml('', `<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`)
  try {
    await sendMail({ to: recipients, subject: subject.trim(), text: message, html, attachments: sgAttachments.length ? sgAttachments : undefined })
  } catch (e) {
    logger.error('SendGrid error', e?.response?.body || e)
    if (e instanceof HttpsError) throw e
    throw new HttpsError('internal', 'The email service rejected the request. Check the sender address and API key.')
  }

  await db.collection('emailLogs').add({
    subject: subject.trim(), recipientCount: recipients.length, recipients, attachmentCount: sgAttachments.length,
    sentBy: caller.uid, sentByEmail: caller.token.email || '', sentAt: FieldValue.serverTimestamp(),
  })
  return { sent: recipients.length }
})

exports.getAnalytics = onCall(async (req) => {
  requireAdmin(req)
  const [events, regs, users] = await Promise.all([db.collection('events').get(), db.collection('registrations').get(), db.collection('users').get()])

  const perEventMap = new Map()
  const eventById = new Map()
  let ratingSum = 0
  let ratingCount = 0
  events.forEach((d) => {
    const e = d.data()
    eventById.set(d.id, e)
    perEventMap.set(d.id, { title: e.title, registrations: 0, avgRating: e.ratingCount ? Number((e.ratingSum / e.ratingCount).toFixed(1)) : null })
    ratingSum += e.ratingSum || 0
    ratingCount += e.ratingCount || 0
  })

  const catMap = new Map()
  const dayMap = new Map()
  const fmtDay = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  for (let i = 13; i >= 0; i--) dayMap.set(fmtDay(new Date(Date.now() - i * 86400000)), 0)

  regs.forEach((d) => {
    const r = d.data()
    if (perEventMap.has(r.eventId)) perEventMap.get(r.eventId).registrations++
    const cat = r.category || eventById.get(r.eventId)?.category || 'Other'
    catMap.set(cat, (catMap.get(cat) || 0) + 1)
    if (r.createdAt) {
      const day = fmtDay(r.createdAt.toDate())
      if (dayMap.has(day)) dayMap.set(day, dayMap.get(day) + 1)
    }
  })

  let volunteers = 0
  users.forEach((d) => { if (d.data().role !== 'admin') volunteers++ })

  return {
    totals: { events: events.size, registrations: regs.size, volunteers, avgRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(1)) : null },
    perEvent: [...perEventMap.values()],
    byCategory: [...catMap].map(([category, count]) => ({ category, count })),
    byDay: [...dayMap].map(([date, count]) => ({ date, count })),
  }
})

// ---------------------------------------------------------------- Firestore triggers
exports.onRegistrationCreated = onDocumentCreated({ document: 'registrations/{regId}', secrets: [SENDGRID_API_KEY] }, async (event) => {
  const reg = event.data?.data()
  if (!reg) return
  await addPoints(reg.uid, 10)

  const evSnap = await db.doc(`events/${reg.eventId}`).get()
  const ev = evSnap.exists ? { id: evSnap.id, ...evSnap.data() } : null
  const when = ev ? `${ev.date} at ${ev.time}` : reg.eventDate
  const inner = `
    <p>Hi ${escapeHtml(reg.name)},</p>
    <p>Thanks for volunteering! You're registered for <strong>${escapeHtml(reg.eventTitle)}</strong>.</p>
    <p><strong>When:</strong> ${escapeHtml(when)}<br><strong>Where:</strong> ${escapeHtml(ev?.address || reg.suburb || '')}</p>
    <p>A calendar invite is attached. You earned <strong>10 eco points</strong>!</p>`
  try {
    await sendMail({
      to: [reg.email],
      subject: `You're registered: ${reg.eventTitle}`,
      html: emailHtml('Registration confirmed', inner),
      text: `Hi ${reg.name}, you're registered for ${reg.eventTitle} (${when}).`,
      attachments: ev ? [{ filename: 'event.ics', type: 'text/calendar', disposition: 'attachment', content: Buffer.from(buildIcs(ev)).toString('base64') }] : undefined,
    })
  } catch (e) {
    logger.error('Confirmation email failed', e?.response?.body || e) // do not fail the registration
  }
})

exports.onRatingWritten = onDocumentWritten('ratings/{ratingId}', async (event) => {
  const after = event.data?.after?.data()
  const before = event.data?.before?.data()
  const eventId = (after || before)?.eventId
  if (!eventId) return

  const snap = await db.collection('ratings').where('eventId', '==', eventId).get()
  let sum = 0
  snap.forEach((d) => { sum += d.data().value })
  const evRef = db.doc(`events/${eventId}`)
  if ((await evRef.get()).exists) {
    await evRef.update({ ratingSum: sum, ratingCount: snap.size, ratingAvg: snap.size ? Number((sum / snap.size).toFixed(2)) : 0 })
  }
  if (after && !before) await addPoints(after.uid, 2)
})
