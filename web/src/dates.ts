// All maths is UTC on YYYY-MM-DD strings, so the local timezone can't shift a day.
const DAY = 86_400_000

export const MIN_WEEKS = 4
export const MAX_WEEKS = 12 // matches maxWeeks in api/capacity.go

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function addDays(iso: string, n: number) {
  return toIso(toMs(iso) + n * DAY)
}

/** 0 = Monday ... 6 = Sunday */
export function dayIndex(iso: string) {
  return (new Date(toMs(iso)).getUTCDay() + 6) % 7
}

export const startOfWeek = (iso: string) => addDays(iso, -dayIndex(iso))
export const endOfWeek = (iso: string) => addDays(startOfWeek(iso), 6)

/** Weeks from a Monday to a Sunday, inclusive. */
export function weeksBetween(fromMon: string, toSun: string) {
  return Math.round((toMs(toSun) - toMs(fromMon) + DAY) / DAY / 7)
}

/** Today's local date as ISO. */
export function todayIso() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Integer weeks within 4-12; NaN falls back to the minimum. */
export function clampWeeks(n: number) {
  if (Number.isNaN(n)) return MIN_WEEKS
  return Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, Math.trunc(n)))
}

/** Last day (Sunday) of a range of `weeks` whole weeks starting at `from`. */
export const rangeEnd = (from: string, weeks: number) => addDays(from, weeks * 7 - 1)

const parts = (iso: string) => ({
  y: Number(iso.slice(0, 4)),
  m: Number(iso.slice(5, 7)),
  d: Number(iso.slice(8, 10)),
})

/** A week belongs to the year of its Monday. */
export function groupWeeksByYear(weeks: string[]) {
  const groups: { year: number; span: number }[] = []
  for (const w of weeks) {
    const year = parts(w).y
    const last = groups[groups.length - 1]
    if (last && last.year === year) last.span++
    else groups.push({ year, span: 1 })
  }
  return groups
}

/** "5–11 Jan" within a month, "29 Dec–4 Jan" across months. */
export function formatWeekLabel(mondayIso: string) {
  const a = parts(mondayIso)
  const b = parts(addDays(mondayIso, 6))
  return a.m === b.m
    ? `${a.d}–${b.d} ${MONTHS[b.m - 1]}`
    : `${a.d} ${MONTHS[a.m - 1]}–${b.d} ${MONTHS[b.m - 1]}`
}

export function formatLongDate(iso: string) {
  const { y, m, d } = parts(iso)
  return `${WEEKDAYS[dayIndex(iso)]} ${d} ${MONTHS[m - 1]} ${y}`
}
