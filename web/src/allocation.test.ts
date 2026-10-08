import { describe, expect, it } from 'vitest'
import { allocationPct, avgAllocationPct, cellLevel, cellSubtitle, formatHours, overBy } from './allocation'

describe('allocation', () => {
  it('flags Dee 45/40 as over by 5h at 112.5%', () => {
    expect(cellLevel(45, 40)).toBe('over')
    expect(allocationPct(45, 40)).toBe(112.5)
    expect(overBy(45, 40)).toBe(5)
  })

  it('assigns levels in fixed steps', () => {
    expect(cellLevel(40, 40)).toBe('high')
    expect(cellLevel(30, 40)).toBe('mid')
    expect(cellLevel(10, 40)).toBe('low')
    expect(cellLevel(0, 40)).toBe('idle')
  })

  it('handles zero capacity without dividing', () => {
    expect(cellLevel(20, 0)).toBe('over')
    expect(allocationPct(20, 0)).toBeNull()
    expect(cellLevel(0, 0)).toBe('idle')
  })

  it('tolerates float noise at exactly 100%', () => {
    expect(cellLevel(40.00000000001, 40)).toBe('high')
    expect(overBy(40.00000000001, 40)).toBe(0)
  })

  it('averages over the weeks shown', () => {
    expect(avgAllocationPct([40, 0, 30, 0], 40)).toBe(43.75)
    expect(avgAllocationPct([40, 0], 0)).toBeNull()
  })

  it('formats hours', () => {
    expect(formatHours(37.5)).toBe('37.5')
    expect(formatHours(40)).toBe('40')
  })
})

describe('cellSubtitle', () => {
  it('reads allocated out of capacity', () => {
    expect(cellSubtitle(30, 40)).toBe('30h out of 40')
    expect(cellSubtitle(0, 40)).toBe('0h out of 40')
    expect(cellSubtitle(37.5, 40)).toBe('37.5h out of 40')
  })
  it('adds the overage when over', () => {
    expect(cellSubtitle(45, 40)).toBe('45h out of 40 (+5h)')
    expect(cellSubtitle(30, 20)).toBe('30h out of 20 (+10h)')
  })
  it('is null without capacity', () => {
    expect(cellSubtitle(20, 0)).toBeNull()
  })
})
