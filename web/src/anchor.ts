import { useEffect, useRef, type ToggleEvent } from 'react'


const MARGIN = 8
const GAP = 6

/**
 * Positions a floating element (already shown, ideally in the top layer) next to its trigger.
 * Flips to the other side when it doesn't fit and keeps it inside the viewport horizontally.
 */
export function placeNear(trigger: HTMLElement, floating: HTMLElement, side: 'below' | 'above' = 'below') {
  const t = trigger.getBoundingClientRect()
  const w = floating.offsetWidth
  const h = floating.offsetHeight

  const fitsBelow = t.bottom + GAP + h <= window.innerHeight - MARGIN
  const fitsAbove = t.top - GAP - h >= MARGIN
  const below = side === 'below' ? fitsBelow || !fitsAbove : !fitsAbove && fitsBelow

  const top = below ? t.bottom + GAP : t.top - GAP - h
  const maxLeft = Math.max(MARGIN, window.innerWidth - w - MARGIN)
  const left = Math.min(maxLeft, Math.max(MARGIN, t.left + t.width / 2 - w / 2))

  floating.style.position = 'fixed'
  floating.style.top = `${Math.max(MARGIN, top)}px`
  floating.style.left = `${left}px`
}

/** Wires a `popover="auto"` element to its trigger: placed on open, closed on resize and scroll. */
export function useAnchoredPopover<T extends HTMLElement = HTMLDivElement>(onOpen?: () => void) {
  const trigger = useRef<HTMLButtonElement>(null)
  const popover = useRef<T>(null)
  const cleanup = useRef<(() => void) | null>(null)

  useEffect(() => () => cleanup.current?.(), [])

  const onToggle = (e: ToggleEvent) => {
    const el = popover.current
    cleanup.current?.()
    cleanup.current = null
    if (e.newState !== 'open' || !el || !trigger.current) return
    onOpen?.()
    placeNear(trigger.current, el)
    const close = (ev: Event) => {
      if (ev.target instanceof Node && el.contains(ev.target)) return
      el.hidePopover()
    }
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    cleanup.current = () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }

  return { trigger, popover, onToggle }
}
