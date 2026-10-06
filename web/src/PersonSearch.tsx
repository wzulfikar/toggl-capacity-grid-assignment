import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function PersonSearch({ value, onChange }: Props) {
  // Local state keeps typing instant; the parent value follows.
  const [text, setText] = useState(value)
  const pushed = useRef(value)

  // Adopt changes that didn't come from this input (Clear search, Back/forward).
  useEffect(() => {
    if (value !== pushed.current) {
      pushed.current = value
      setText(value)
    }
  }, [value])

  const update = (next: string) => {
    pushed.current = next
    setText(next)
    onChange(next)
  }

  return (
    <div className="search">
      <Search size={16} aria-hidden />
      <input
        type="search"
        aria-label="Search people"
        placeholder="Search people"
        value={text}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && text) update('')
        }}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label="Clear search"
        aria-hidden={!text}
        tabIndex={text ? 0 : -1}
        style={text ? undefined : { visibility: 'hidden' }}
        onClick={() => update('')}
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  )
}
