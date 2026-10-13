// Input hardening helpers (carried over from A1.2 and extended for A3).

export const sanitizeInput = (text) => {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim()
}

// Escape HTML special characters for safe interpolation inside email HTML.
export const escapeHtml = sanitizeInput

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim())

export const looksLikeScript = (text) => /<\s*\/?\s*script/i.test(String(text ?? ''))

// Prevent CSV/Excel formula injection when exporting user-entered text.
export const csvSafe = (value) => {
  const s = String(value ?? '')
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

export const passwordIssues = (pw) => {
  const issues = []
  if (pw.length < 8) issues.push('at least 8 characters')
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) issues.push('upper and lower case letters')
  if (!/\d/.test(pw)) issues.push('a number')
  return issues
}
