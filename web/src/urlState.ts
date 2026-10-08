import { createParser, parseAsString, throttle, useQueryStates } from 'nuqs'
import { MIN_WEEKS, clampWeeks, rangeEnd, startOfWeek } from './dates'

// 4 weeks from where the data has its interesting cases (a holiday week, over-allocation).
export const DEFAULT_FROM = '2025-12-29'
export const DEFAULT_WEEKS = MIN_WEEKS

/** Valid calendar date as YYYY-MM-DD, or null. Round-trips so 2026-02-30 is rejected. */
function validIso(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const d = new Date(`${v}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : v
}

// The URL is untrusted: anything unparseable falls back to the default.
export const parseFrom = (v: string) => {
  const iso = validIso(v)
  return iso ? startOfWeek(iso) : null
}

export const parseWeeks = (v: string) => (/^-?\d+$/.test(v) ? clampWeeks(Number(v)) : null)

const fromParser = createParser({ parse: parseFrom, serialize: (v: string) => v })
const weeksParser = createParser({ parse: parseWeeks, serialize: (v: number) => String(v) })

const parsers = {
  from: fromParser.withDefault(DEFAULT_FROM).withOptions({ history: 'push', clearOnDefault: true }),
  weeks: weeksParser.withDefault(DEFAULT_WEEKS).withOptions({ history: 'push', clearOnDefault: true }),
  q: parseAsString
    .withDefault('')
    .withOptions({ history: 'replace', clearOnDefault: true, limitUrlUpdates: throttle(300) }),
}

export function useRangeState() {
  const [{ from, weeks, q }, setState] = useQueryStates(parsers)

  const setRange = (partial: { from?: string; weeks?: number }) =>
    setState({
      ...(partial.from !== undefined && { from: startOfWeek(partial.from) }),
      ...(partial.weeks !== undefined && { weeks: clampWeeks(partial.weeks) }),
    })

  const setQ = (value: string) => setState({ q: value })

  return { from, weeks, to: rangeEnd(from, weeks), q, setRange, setQ }
}
