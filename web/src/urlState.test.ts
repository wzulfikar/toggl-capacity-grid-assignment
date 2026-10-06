import { renderHook, act } from '@testing-library/react'
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from 'nuqs/adapters/testing'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_FROM, DEFAULT_WEEKS, parseFrom, parseWeeks, useRangeState } from './urlState'

describe('parseFrom', () => {
  it('snaps to Monday', () => {
    expect(parseFrom('2026-01-01')).toBe('2025-12-29')
    expect(parseFrom('2026-01-05')).toBe('2026-01-05')
  })
  it('rejects junk and impossible dates', () => {
    expect(parseFrom('junk')).toBeNull()
    expect(parseFrom('2026-02-30')).toBeNull()
    expect(parseFrom('')).toBeNull()
  })
})

describe('parseWeeks', () => {
  it('clamps to 4-12', () => {
    expect(parseWeeks('2')).toBe(4)
    expect(parseWeeks('20')).toBe(12)
    expect(parseWeeks('8')).toBe(8)
  })
  it('rejects non-numbers', () => {
    expect(parseWeeks('x')).toBeNull()
    expect(parseWeeks('')).toBeNull()
  })
})

describe('useRangeState', () => {
  it('falls back to defaults for a bad URL', () => {
    const { result } = renderHook(() => useRangeState(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?from=junk&weeks=x' }),
    })
    expect(result.current.from).toBe(DEFAULT_FROM)
    expect(result.current.weeks).toBe(DEFAULT_WEEKS)
    expect(result.current.to).toBe('2026-01-25')
  })

  it('derives the range from the URL', () => {
    const { result } = renderHook(() => useRangeState(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '?from=2026-01-07&weeks=8&q=dee' }),
    })
    expect(result.current).toMatchObject({ from: '2026-01-05', weeks: 8, to: '2026-03-01', q: 'dee' })
  })

  it('pushes history on range changes and keeps the default URL clean', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(() => useRangeState(), {
      wrapper: withNuqsTestingAdapter({ searchParams: '', onUrlUpdate }),
    })
    act(() => {
      void result.current.setRange({ from: '2026-01-28' })
    })
    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const event = onUrlUpdate.mock.calls[0]![0]!
    expect(event.queryString).toBe('?from=2026-01-26')
    expect(event.options.history).toBe('push')
  })
})
