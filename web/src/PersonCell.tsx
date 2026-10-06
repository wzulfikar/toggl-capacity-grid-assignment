import { Info } from 'lucide-react'
import { avgAllocationPct } from './allocation'
import type { PersonCapacity } from './api'
import { Tooltip } from './Tooltip'

export const NO_CAPACITY_TIP =
  'No capacity set (0h/week). Any allocated hours count as over-allocated.'

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function PersonCell({ person }: { person: PersonCapacity }) {
  const avg = avgAllocationPct(person.allocated, person.weeklyHours)
  return (
    <div className="person">
      <span className="avatar" style={{ background: `hsl(${(person.id * 47) % 360}, 55%, 45%)` }} aria-hidden>
        {initials(person.name)}
      </span>
      <span className="person-text">
        <span className="person-name">{person.name}</span>
        <span className="person-avg">
          {avg === null ? (
            <Tooltip text={NO_CAPACITY_TIP}>
              Avg. allocation: {person.allocated.some((h) => h > 0) ? 'Over allocated' : 'No capacity set'}{' '}
              <Info size={14} aria-hidden />
            </Tooltip>
          ) : (
            `Avg. allocation: ${Math.round(avg)}%`
          )}
        </span>
      </span>
    </div>
  )
}
