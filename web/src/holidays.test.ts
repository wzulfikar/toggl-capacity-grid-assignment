import { describe, expect, it } from 'vitest'
import { holidaysInWeek } from './holidays'

describe('holidaysInWeek', () => {
  it('finds New Year across the year boundary', () => {
    expect(holidaysInWeek('2025-12-29')).toEqual([{ date: '2026-01-01', name: "New Year's Day" }])
  })
  it('finds Christmas on a weekday', () => {
    expect(holidaysInWeek('2025-12-22')).toEqual([{ date: '2025-12-25', name: 'Christmas Day' }])
  })
  it('ignores a holiday on a weekend', () => {
    expect(holidaysInWeek('2027-12-20')).toEqual([])
  })
  it('returns nothing for an ordinary week', () => {
    expect(holidaysInWeek('2026-03-02')).toEqual([])
  })
})
