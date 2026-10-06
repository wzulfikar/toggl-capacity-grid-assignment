const EPS = 1e-9

export type Level = 'idle' | 'low' | 'mid' | 'high' | 'over'

export function isOver(allocated: number, capacity: number) {
  return allocated > capacity + EPS
}

export function cellLevel(allocated: number, capacity: number): Level {
  if (allocated <= EPS) return 'idle'
  if (isOver(allocated, capacity)) return 'over'
  const pct = allocated / capacity
  if (pct < 0.5) return 'low'
  if (pct < 0.9) return 'mid'
  return 'high'
}

export function allocationPct(allocated: number, capacity: number): number | null {
  return capacity > 0 ? (allocated / capacity) * 100 : null
}

/** Average over the weeks on screen; null when there's no capacity to divide by. */
export function avgAllocationPct(allocated: number[], weeklyHours: number): number | null {
  if (weeklyHours <= 0 || allocated.length === 0) return null
  const sum = allocated.reduce((a, b) => a + b, 0)
  return (sum / (weeklyHours * allocated.length)) * 100
}

/** At most 1 decimal, no trailing ".0". */
export function formatHours(n: number) {
  return String(Math.round(n * 10) / 10)
}

export function overBy(allocated: number, capacity: number) {
  return isOver(allocated, capacity) ? allocated - capacity : 0
}

/** Sub line of a grid cell; null when there is no capacity to compare against. */
export function cellSubtitle(allocated: number, capacity: number): string | null {
  if (capacity <= 0) return null
  const over = overBy(allocated, capacity)
  return `${formatHours(allocated)}h out of ${formatHours(capacity)}${over > 0 ? ` (+${formatHours(over)}h)` : ''}`
}
