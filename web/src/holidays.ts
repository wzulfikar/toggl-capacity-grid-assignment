import { addDays } from './dates'

// An assumed list of common holidays. The schema has no holiday data or
// per-person country, so this is info only and never reduces capacity.
export const HOLIDAYS = [
  { month: 1, day: 1, name: "New Year's Day" },
  { month: 12, day: 25, name: 'Christmas Day' },
]

/** Holidays that fall on Mon-Fri of the week starting at `mondayIso`. */
export function holidaysInWeek(mondayIso: string): { date: string; name: string }[] {
  const found: { date: string; name: string }[] = []
  for (let i = 0; i < 5; i++) {
    const date = addDays(mondayIso, i)
    const month = Number(date.slice(5, 7))
    const day = Number(date.slice(8, 10))
    const h = HOLIDAYS.find((x) => x.month === month && x.day === day)
    if (h) found.push({ date, name: h.name })
  }
  return found
}
