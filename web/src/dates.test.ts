import { describe, expect, it } from 'vitest'
import {
  addDays,
  clampWeeks,
  dayIndex,
  endOfWeek,
  formatWeekLabel,
  groupWeeksByYear,
  rangeEnd,
  startOfWeek,
  weeksBetween,
} from './dates'

describe('week snapping', () => {
  it('snaps Sunday back to Monday', () => {
    expect(startOfWeek('2026-01-04')).toBe('2025-12-29')
  })
  it('snaps Friday forward to Sunday', () => {
    expect(endOfWeek('2026-01-16')).toBe('2026-01-18')
  })
  it('crosses a year boundary', () => {
    expect(addDays('2025-12-31', 2)).toBe('2026-01-02')
    expect(startOfWeek('2026-01-01')).toBe('2025-12-29')
    expect(dayIndex('2025-12-29')).toBe(0)
    expect(dayIndex('2026-01-04')).toBe(6)
  })
  it('counts weeks', () => {
    expect(weeksBetween('2025-12-29', '2026-01-25')).toBe(4)
  })
})

describe('clampWeeks', () => {
  it('limits to 4-12 and truncates', () => {
    expect(clampWeeks(2)).toBe(4)
    expect(clampWeeks(20)).toBe(12)
    expect(clampWeeks(8.9)).toBe(8)
    expect(clampWeeks(NaN)).toBe(4)
  })
})

describe('rangeEnd', () => {
  it('ends on the Sunday of the last week', () => {
    expect(rangeEnd('2025-12-29', 4)).toBe('2026-01-25')
    expect(rangeEnd('2026-01-05', 12)).toBe('2026-03-29')
  })
})

describe('week labels', () => {
  it('groups weeks by the year of their Monday', () => {
    expect(groupWeeksByYear(['2025-12-29', '2026-01-05', '2026-01-12'])).toEqual([
      { year: 2025, span: 1 },
      { year: 2026, span: 2 },
    ])
  })

  it('labels a week within one month and across months', () => {
    expect(formatWeekLabel('2026-01-05')).toBe('5–11 Jan')
    expect(formatWeekLabel('2025-12-29')).toBe('29 Dec–4 Jan')
  })
})
