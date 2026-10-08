export type PersonCapacity = {
  id: number
  name: string
  weeklyHours: number
  /** allocated[i] belongs to weeks[i] */
  allocated: number[]
}

export type CapacityResponse = {
  from: string
  to: string
  weeks: string[]
  people: PersonCapacity[]
}

export type UpdatedPerson = { id: number; name: string; weeklyHours: number }

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const capacityKey = (from: string, to: string) => ['capacity', from, to] as const

const UNREACHABLE = "Couldn't reach the server. Try again in a moment."

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(UNREACHABLE, 0)
  }
  // The dev proxy answers 502 when the API is down.
  if ([502, 503, 504].includes(res.status)) throw new ApiError(UNREACHABLE, res.status)
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status)
  }
  return (await res.json()) as T
}

export function fetchCapacity(from: string, to: string, signal?: AbortSignal) {
  const qs = new URLSearchParams({ from, to })
  return request<CapacityResponse>(`/api/capacity?${qs}`, { signal })
}

export function updateWeeklyHours(id: number, weeklyHours: number) {
  return request<UpdatedPerson>(`/api/people/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weeklyHours }),
  })
}
