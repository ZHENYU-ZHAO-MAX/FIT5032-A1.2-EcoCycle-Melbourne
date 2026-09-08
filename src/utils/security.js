
export const sanitizeInput = (text) => {

  return text
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .trim()

}