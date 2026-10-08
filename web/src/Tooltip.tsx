import { useId, useRef, type ReactNode } from 'react'
import { placeNear } from './anchor'

type Props = {
  text: string
  children: ReactNode
  className?: string
}

// The tip lives in the top layer (popover="manual"), so it isn't clipped by the scroll
// container or covered by sticky columns.
export function Tooltip({ text, children, className }: Props) {
  const id = useId()
  const trigger = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLDivElement>(null)

  const show = () => {
    const el = tip.current
    if (!el || !trigger.current) return
    if (!el.matches(':popover-open')) el.showPopover()
    placeNear(trigger.current, el, 'above')
  }
  const hide = () => {
    if (tip.current?.matches(':popover-open')) tip.current.hidePopover()
  }

  return (
    <span
      ref={trigger}
      className={`tip ${className ?? ''}`}
      tabIndex={0}
      aria-describedby={id}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={(e) => e.key === 'Escape' && hide()}
    >
      {children}
      <div ref={tip} id={id} role="tooltip" popover="manual" className="tip-text">
        {text}
      </div>
    </span>
  )
}
