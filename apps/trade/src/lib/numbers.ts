/**
 * Because JS isNaN and Number can't be trusted with whitespace, null, and boolean!
 * Fun fact:
 * Number() actually removes any whitespace (including special codes) before converting,
 * and isNaN() uses Number() internally, so it does the same thing before checking!
 */
export const isNumber = function (val: any): boolean {
  let type = typeof val
  if (type === 'object' || type === 'boolean') return false // null, true, false
  let str = val.toString().trim()
  if (!str) return false // '', '\n', ' ', ' 0 ', '\n 0 \t', etc.
  let num = Number(str)
  if (isNaN(num)) return false // obvious non-numeric characters
  return true
}
