import { CapacityGrid } from './CapacityGrid'
import { formatLongDate, startOfWeek, todayIso } from './dates'
import { RangeControls } from './RangeControls'
import { useRangeState } from './urlState'

export function App() {
  const { from, weeks, to, q, setRange, setQ } = useRangeState()

  const today = todayIso()
  const todayInRange = startOfWeek(today) >= from && startOfWeek(today) <= startOfWeek(to)

  return (
    <main>
      <h1>Team capacity</h1>
      <div className="toolbar">
        <RangeControls from={from} weeks={weeks} to={to} onChange={setRange} />
        <div className="toolbar-right">
          {todayInRange && <span className="today-date">Today: {formatLongDate(today)}</span>}
          <button type="button" onClick={() => setRange({ from: startOfWeek(todayIso()) })}>
            Today
          </button>
        </div>
      </div>
      <CapacityGrid from={from} to={to} query={q} onQueryChange={setQ} onClearQuery={() => setQ('')} />
    </main>
  )
}
