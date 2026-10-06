import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { capacityKey, type CapacityResponse } from './api'
import { patchPersonHours } from './capacityCache'

const make = (from: string, ids: number[]): CapacityResponse => ({
  from,
  to: from,
  weeks: [from],
  people: ids.map((id) => ({ id, name: `P${id}`, weeklyHours: 40, allocated: [10] })),
})

describe('patchPersonHours', () => {
  it('patches the right person and keeps the others reference-equal', () => {
    const data = make('2026-01-05', [1, 2, 3])
    const out = patchPersonHours(data, { id: 2, weeklyHours: 32 })!
    expect(out.people[1].weeklyHours).toBe(32)
    expect(out.people[1].allocated).toBe(data.people[1].allocated)
    expect(out.people[0]).toBe(data.people[0])
    expect(out.people[2]).toBe(data.people[2])
    expect(data.people[1].weeklyHours).toBe(40)
  })

  it('handles undefined', () => {
    expect(patchPersonHours(undefined, { id: 1, weeklyHours: 1 })).toBeUndefined()
  })

  it('leaves a range without the person untouched', () => {
    const data = make('2026-01-05', [1, 2])
    expect(patchPersonHours(data, { id: 9, weeklyHours: 32 })).toBe(data)
  })

  it('leaves an unchanged value untouched', () => {
    const data = make('2026-01-05', [1])
    expect(patchPersonHours(data, { id: 1, weeklyHours: 40 })).toBe(data)
  })

  it('updates every cached range through setQueriesData', () => {
    const qc = new QueryClient()
    qc.setQueryData(capacityKey('2026-01-05', '2026-02-01'), make('2026-01-05', [1, 2]))
    qc.setQueryData(capacityKey('2026-02-02', '2026-03-01'), make('2026-02-02', [1, 2]))
    qc.setQueriesData<CapacityResponse>({ queryKey: ['capacity'] }, (d) =>
      patchPersonHours(d, { id: 1, weeklyHours: 32 }),
    )
    for (const key of [capacityKey('2026-01-05', '2026-02-01'), capacityKey('2026-02-02', '2026-03-01')]) {
      expect(qc.getQueryData<CapacityResponse>(key)!.people[0].weeklyHours).toBe(32)
    }
  })
})
