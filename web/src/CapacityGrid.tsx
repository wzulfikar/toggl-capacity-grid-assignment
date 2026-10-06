import { memo, useDeferredValue, useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import { allocationPct, cellLevel, cellSubtitle, formatHours, type Level } from './allocation'
import { capacityKey, fetchCapacity, type PersonCapacity } from './api'
import { dayIndex, startOfWeek, todayIso } from './dates'
import { NO_CAPACITY_TIP, PersonCell } from './PersonCell'
import { PersonSearch } from './PersonSearch'
import { filterPeople } from './search'
import { Tooltip } from './Tooltip'
import { WeekHeader } from './WeekHeader'
import { WeeklyHoursCell } from './WeeklyHoursCell'

type Props = {
  from: string
  to: string
  query?: string
  onQueryChange?: (value: string) => void
  onClearQuery?: () => void
}

const LEGEND: { level: Level; label: string }[] = [
  { level: 'idle', label: '0%' },
  { level: 'mid', label: '50–100%' },
  { level: 'over', label: 'Over 100%' },
]

function Cell({ allocated, capacity }: { allocated: number; capacity: number }) {
  const level = cellLevel(allocated, capacity)
  const pct = allocationPct(allocated, capacity)

  if (pct === null) {
    return (
      <div className="cell-body">
        <span className="cell-main">
          {level === 'over' && (
            <Tooltip text={NO_CAPACITY_TIP}>
              <CircleAlert size={16} aria-label="No capacity set" />
            </Tooltip>
          )}
          {formatHours(allocated)}h
        </span>
      </div>
    )
  }

  return (
    <div className="cell-body">
      <span className="cell-main">
        {level === 'over' && <TriangleAlert size={16} aria-label="Over-allocated" />}
        {Math.round(pct)}%
      </span>
      <span className="cell-sub">{cellSubtitle(allocated, capacity)}</span>
    </div>
  )
}

const PersonRow = memo(function PersonRow({
  person,
  weeks,
  todayWeek,
  todayPos,
}: {
  person: PersonCapacity
  weeks: string[]
  todayWeek: string | null
  todayPos: string
}) {
  return (
    <tr>
      <th scope="row" className="sticky-col col-person">
        <PersonCell person={person} />
      </th>
      <td className="sticky-col col-hours">
        <WeeklyHoursCell person={person} />
      </td>
      {weeks.map((w, i) => {
        const isToday = w === todayWeek
        return (
          <td
            key={w}
            className={`cell cell-${cellLevel(person.allocated[i], person.weeklyHours)}${isToday ? ' is-today-col' : ''}`}
            style={isToday ? ({ '--today-pos': todayPos } as React.CSSProperties) : undefined}
          >
            <Cell allocated={person.allocated[i]} capacity={person.weeklyHours} />
          </td>
        )
      })}
    </tr>
  )
})

// CapacityGrid renders one row per person and one column per week. Percentages
// are computed here from allocated[i] and weeklyHours, so a saved edit
// recalculates the row without a refetch.
export function CapacityGrid({ from, to, query = '', onQueryChange, onClearQuery }: Props) {
  const { data, error, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: capacityKey(from, to),
    queryFn: ({ signal }) => fetchCapacity(from, to, signal),
    placeholderData: keepPreviousData,
  })
  // Filtering 500 rows is deferred so typing in the search box stays responsive.
  const deferredQuery = useDeferredValue(query)
  const people = useMemo(() => filterPeople(data?.people ?? [], deferredQuery), [data, deferredQuery])
  const filtering = deferredQuery.trim() !== ''

  if (!data) {
    if (isError) {
      return (
        <div role="alert" className="notice">
          {error.message}{' '}
          <button type="button" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )
    }
    return <p role="status">Loading capacity…</p>
  }

  const today = todayIso()
  const todayWeek = data.weeks.includes(startOfWeek(today)) ? startOfWeek(today) : null
  const todayPos = `calc(${dayIndex(today) + 0.5} / 7 * 100%)`
  const busy = isPlaceholderData || isFetching
  const stale = query !== deferredQuery

  return (
    <>
      <div className="legend-row">
        <ul className="legend" aria-label="Legend">
          {LEGEND.map((l) => (
            <li key={l.level}>
              <span className={`swatch cell-${l.level}`} aria-hidden />
              {l.label}
            </li>
          ))}
        </ul>

        {onQueryChange && (
          <div className="legend-search">
            <PersonSearch value={query} onChange={onQueryChange} />
            {filtering && (
              <span className="search-count">
                {people.length} of {data.people.length} people
              </span>
            )}
          </div>
        )}
      </div>

      {isError && (
        <div role="alert" className="notice">
          {error.message}{' '}
          <button type="button" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}
      {busy && <p role="status" className="updating">Updating…</p>}

      {data.people.length === 0 ? (
        <p>No people to show.</p>
      ) : people.length === 0 ? (
        <p>
          No people match "{deferredQuery.trim()}".{' '}
          {onClearQuery && (
            <button type="button" onClick={onClearQuery}>
              Clear search
            </button>
          )}
        </p>
      ) : (
        <div className="grid-scroll">
          <table className="grid" aria-busy={busy}>
            <WeekHeader weeks={data.weeks} todayWeek={todayWeek} todayPos={todayPos} />
            <tbody className={busy || stale ? 'is-busy' : undefined}>
              {people.map((p) => (
                <PersonRow key={p.id} person={p} weeks={data.weeks} todayWeek={todayWeek} todayPos={todayPos} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
