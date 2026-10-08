import { describe, expect, it } from 'vitest'
import type { PersonCapacity } from './api'
import { damerauLevenshtein, filterPeople, matchScore, normalize } from './search'

const person = (id: number, name: string): PersonCapacity => ({ id, name, weeklyHours: 40, allocated: [] })
const people = [
  person(1, 'Søren Öberg'),
  person(2, 'Dee Okafor'),
  person(3, 'José Álvarez'),
  person(4, 'Eli Nakamura'),
  person(5, 'Elias Brandt'),
  person(6, 'Ana Ferreira'),
  person(7, 'Diana Ross'),
  person(8, 'Linnea Öberg'),
  person(9, 'Alan Turing'),
]
const names = (q: string) => filterPeople(people, q).map((p) => p.name)

describe('normalize', () => {
  it('strips accents, case and padding', () => {
    expect(normalize('  Öberg ')).toBe('oberg')
    expect(normalize('José')).toBe('jose')
  })
})

describe('damerauLevenshtein', () => {
  it('counts insertions, substitutions and adjacent swaps as one', () => {
    expect(damerauLevenshtein('nakmura', 'nakamura')).toBe(1)
    expect(damerauLevenshtein('nakamrua', 'nakamura')).toBe(1)
    expect(damerauLevenshtein('anna', 'ana')).toBe(1)
    expect(damerauLevenshtein('abc', 'abc')).toBe(0)
  })
})

describe('filterPeople', () => {
  it('matches accented names with plain input', () => {
    expect(names('oberg')).toEqual(['Søren Öberg', 'Linnea Öberg'])
    expect(names('ALVAREZ')).toEqual(['José Álvarez'])
  })
  it('ranks exact prefix matches first', () => {
    expect(names('eli')[0]).toBe('Eli Nakamura')
  })
  it('tolerates a deletion', () => {
    expect(names('nakmura')).toEqual(['Eli Nakamura'])
  })
  it('tolerates one typo per token', () => {
    expect(names('anna fereira')).toEqual(['Ana Ferreira'])
  })
  it('tolerates a transposition', () => {
    expect(names('nakamrua')).toEqual(['Eli Nakamura'])
  })
  it('allows no typos in short queries', () => {
    const result = names('al')
    expect(result).toContain('Alan Turing')
    expect(result).toContain('José Álvarez')
    expect(result).not.toContain('Ana Ferreira')
  })
  it('returns nothing when nothing matches', () => {
    expect(names('zzzz')).toEqual([])
  })
  it('returns the same array for an empty or blank query', () => {
    expect(filterPeople(people, '')).toBe(people)
    expect(filterPeople(people, '  ')).toBe(people)
  })
  it('ranks a word-start match before a mid-word match', () => {
    expect(names('ana')).toEqual(['Ana Ferreira', 'Diana Ross'])
    expect(matchScore('Ana Ferreira', 'ana')).toBeLessThan(matchScore('Diana Ross', 'ana')!)
  })
})
