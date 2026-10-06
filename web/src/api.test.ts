import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCapacity } from './api'

const MSG = "Couldn't reach the server. Try again in a moment."

afterEach(() => vi.unstubAllGlobals())

describe('request errors', () => {
  it.each([502, 503, 504])('maps %i to the unreachable message', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('bad gateway', { status })))
    await expect(fetchCapacity('2025-12-29', '2026-01-25')).rejects.toMatchObject({ message: MSG, status })
  })

  it("uses the body's error for other failures", async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'x' }), { status: 400 })),
    )
    await expect(fetchCapacity('a', 'b')).rejects.toMatchObject({ message: 'x', status: 400 })
  })

  it('maps a failed fetch to the unreachable message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(fetchCapacity('a', 'b')).rejects.toMatchObject({ message: MSG, status: 0 })
  })

  it('rethrows AbortError as-is', async () => {
    const abort = new DOMException('aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))
    await expect(fetchCapacity('a', 'b')).rejects.toBe(abort)
  })
})
