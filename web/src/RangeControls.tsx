import { useId, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAnchoredPopover } from './anchor'
import { MAX_WEEKS, MIN_WEEKS, addDays, startOfWeek } from './dates'

type Props = {
  from: string
  weeks: number
  to: string
  onChange: (partial: { from?: string; weeks?: number }) => void
}

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

const WEEK_OPTIONS = Array.from({ length: MAX_WEEKS - MIN_WEEKS + 1 }, (_, i) => MIN_WEEKS + i)

export function RangeControls({ from, weeks, to, onChange }: Props) {
  const popoverId = useId()
  const [draft, setDraft] = useState(from)
  const { trigger, popover, onToggle } = useAnchoredPopover(() => setDraft(from))

  const apply = () => {
    popover.current?.hidePopover()
    if (draft) onChange({ from: startOfWeek(draft) })
  }

  return (
    <div className="toolbar-nav">
      <button type="button" onClick={() => onChange({ from: addDays(from, -weeks * 7) })} aria-label={`Previous ${weeks} weeks`}>
        <ChevronLeft size={16} aria-hidden /> Prev
      </button>
      <button ref={trigger} type="button" className="range-btn" popoverTarget={popoverId}>
        {fmt(from)} – {fmt(to)}
      </button>
      <select aria-label="Weeks shown" value={weeks} onChange={(e) => onChange({ weeks: Number(e.target.value) })}>
        {WEEK_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}w
          </option>
        ))}
      </select>
      <button type="button" onClick={() => onChange({ from: addDays(from, weeks * 7) })} aria-label={`Next ${weeks} weeks`}>
        Next <ChevronRight size={16} aria-hidden />
      </button>

      <div id={popoverId} ref={popover} popover="auto" className="popover range-popover" onToggle={onToggle}>
        <label>
          Start week
          <input type="date" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </label>
        <div className="popover-actions">
          <button type="button" onClick={apply}>
            Apply
          </button>
          <button type="button" onClick={() => popover.current?.hidePopover()}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
