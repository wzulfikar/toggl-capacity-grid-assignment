import { useId } from 'react'
import { Info } from 'lucide-react'
import { useAnchoredPopover } from './anchor'
import { formatLongDate, formatWeekLabel, groupWeeksByYear } from './dates'
import { holidaysInWeek } from './holidays'

function HolidayInfo({ monday }: { monday: string }) {
  const id = useId()
  const { trigger, popover, onToggle } = useAnchoredPopover()
  const holidays = holidaysInWeek(monday)
  if (holidays.length === 0) return null
  return (
    <>
      <button ref={trigger} type="button" className="icon-btn" popoverTarget={id} aria-label="Holiday this week">
        <Info size={14} aria-hidden />
      </button>
      <div id={id} ref={popover} popover="auto" className="popover popover-text" onToggle={onToggle}>
        Week includes a holiday:{' '}
        {holidays.map((h) => `${formatLongDate(h.date)} (${h.name})`).join(', ')}. Capacity isn't
        reduced for holidays.
      </div>
    </>
  )
}

type Props = {
  weeks: string[]
  /** Monday of the week containing today, when it is in the range. */
  todayWeek: string | null
  todayPos: string
}

export function WeekHeader({ weeks, todayWeek, todayPos }: Props) {
  return (
    <thead>
      <tr>
        <th rowSpan={2} className="sticky-col col-person">
          Person
        </th>
        <th rowSpan={2} className="sticky-col col-hours" title="Applies to all weeks">
          Weekly hours
        </th>
        {groupWeeksByYear(weeks).map((g) => (
          <th key={g.year} colSpan={g.span} className="year">
            {g.year}
          </th>
        ))}
      </tr>
      <tr>
        {weeks.map((w) => {
          const isToday = w === todayWeek
          return (
            <th
              key={w}
              className={`week${isToday ? ' is-today-col' : ''}`}
              style={isToday ? ({ '--today-pos': todayPos } as React.CSSProperties) : undefined}
              aria-label={isToday ? `${formatWeekLabel(w)}, includes today` : undefined}
            >
              <span className="week-label">
                {formatWeekLabel(w)}
                <HolidayInfo monday={w} />
              </span>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
