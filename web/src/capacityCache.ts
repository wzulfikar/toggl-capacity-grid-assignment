import type { CapacityResponse } from './api'

/**
 * Returns `data` with one person's weeklyHours replaced. Same reference when
 * the person isn't in `data` or the value is unchanged; other people keep
 * their identity.
 */
export function patchPersonHours(
  data: CapacityResponse | undefined,
  person: { id: number; weeklyHours: number },
): CapacityResponse | undefined {
  if (!data) return data
  const i = data.people.findIndex((p) => p.id === person.id)
  if (i < 0 || data.people[i].weeklyHours === person.weeklyHours) return data
  const people = data.people.slice()
  people[i] = { ...people[i], weeklyHours: person.weeklyHours }
  return { ...data, people }
}
