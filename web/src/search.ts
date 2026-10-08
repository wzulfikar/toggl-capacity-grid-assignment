import type { PersonCapacity } from './api'

/** Lowercase, trimmed, accents stripped ("Öberg" -> "oberg"). */
export const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

const tokenize = (s: string) => s.split(/[\s-]+/).filter(Boolean)

/** Optimal string alignment distance: an adjacent swap counts as one edit. */
export function damerauLevenshtein(a: string, b: string) {
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

const maxTypos = (len: number) => (len <= 3 ? 0 : len <= 6 ? 1 : 2)

function tokenCost(qt: string, nameToken: string): number | null {
  if (nameToken.startsWith(qt)) return 0
  const dist = Math.min(damerauLevenshtein(qt, nameToken), damerauLevenshtein(qt, nameToken.slice(0, qt.length)))
  return dist <= maxTypos(qt.length) ? dist : null
}

/** Lower is better, null is no match. -1 = exact match at a word start, 0 = elsewhere in the name. */
export function matchScore(name: string, q: string): number | null {
  const full = normalize(name)
  const needle = normalize(q)
  if (!needle) return 0

  const at = full.indexOf(needle)
  if (at !== -1) return at === 0 || /[\s-]/.test(full[at - 1]) ? -1 : 0

  const nameTokens = tokenize(full)
  let total = 0
  for (const qt of tokenize(needle)) {
    let best: number | null = null
    for (const nt of nameTokens) {
      const c = tokenCost(qt, nt)
      if (c !== null && (best === null || c < best)) best = c
    }
    if (best === null) return null
    total += best
  }
  return 1 + total
}

export function filterPeople(people: PersonCapacity[], q: string) {
  if (!normalize(q)) return people
  const scored: { p: PersonCapacity; score: number; i: number }[] = []
  people.forEach((p, i) => {
    const score = matchScore(p.name, q)
    if (score !== null) scored.push({ p, score, i })
  })
  return scored.sort((a, b) => a.score - b.score || a.i - b.i).map((s) => s.p)
}
