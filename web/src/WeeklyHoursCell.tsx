import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import { updateWeeklyHours, type CapacityResponse, type PersonCapacity } from './api'
import { patchPersonHours } from './capacityCache'
import { formatHours } from './allocation'

const MAX_HOURS = 168

function validate(text: string): { value: number } | { error: string } {
  const n = Number(text)
  if (text.trim() === '' || !Number.isFinite(n) || n < 0 || n > MAX_HOURS) {
    return { error: `Enter a number from 0 to ${MAX_HOURS}` }
  }
  return { value: n }
}

// Editing changes capacity for every week: the schema has one value per person.
export function WeeklyHoursCell({ person }: { person: PersonCapacity }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  // Escape/Cancel unmount the input, which can fire blur; don't save then.
  const cancelled = useRef(false)

  const mutation = useMutation({
    mutationFn: (hours: number) => updateWeeklyHours(person.id, hours),
    onSuccess: (updated) => {
      queryClient.setQueriesData<CapacityResponse>({ queryKey: ['capacity'] }, (d) =>
        patchPersonHours(d, updated),
      )
      // A range request in flight during the save could return the old value.
      void queryClient.invalidateQueries({ queryKey: ['capacity'] })
      setEditing(false)
    },
  })

  const open = () => {
    cancelled.current = false
    mutation.reset()
    setInvalid(null)
    setText(String(person.weeklyHours))
    setEditing(true)
  }

  const cancel = () => {
    cancelled.current = true
    mutation.reset()
    setInvalid(null)
    setEditing(false)
  }

  const save = () => {
    const result = validate(text)
    if ('error' in result) {
      setInvalid(result.error)
      return
    }
    setInvalid(null)
    mutation.mutate(result.value)
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="hours-btn"
        onClick={open}
        aria-label={`Edit weekly hours for ${person.name} (applies to all weeks)`}
      >
        {formatHours(person.weeklyHours)}h <Pencil size={12} aria-hidden />
      </button>
    )
  }

  const pending = mutation.isPending
  const error = invalid ?? (mutation.isError ? mutation.error.message : null)

  return (
    <div className="hours-edit">
      <div className="hours-input-row">
        <input
          type="number"
          min={0}
          max={MAX_HOURS}
          step={0.5}
          value={text}
          disabled={pending}
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`Weekly hours for ${person.name}`}
          aria-invalid={error !== null}
          onChange={(e) => {
            setText(e.target.value)
            setInvalid(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            else if (e.key === 'Escape') cancel()
          }}
          onBlur={() => {
            if (cancelled.current || pending || mutation.isError) return
            if (Number(text) === person.weeklyHours) cancel()
            else save()
          }}
        />
        {pending && <span role="status">Saving…</span>}
      </div>
      {error && !pending && (
        <span role="alert" className="hours-error">
          {error}
        </span>
      )}
      {mutation.isError && !pending && (
        <span className="hours-actions">
          <button type="button" onClick={save}>
            Retry
          </button>
          <button type="button" onMouseDown={() => (cancelled.current = true)} onClick={cancel}>
            Cancel
          </button>
        </span>
      )}
    </div>
  )
}
