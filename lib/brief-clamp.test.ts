import { describe, it, expect } from 'vitest'
import { clampBriefDescription } from './brief-clamp'

describe('clampBriefDescription', () => {
  it('does not split words when possible (Yardi 35-char brief)', () => {
    expect(clampBriefDescription('Hallway light out & door not latching', 35)).toBe(
      'Hallway light out & door not'
    )
  })

  it('returns short strings unchanged', () => {
    expect(clampBriefDescription('No hot water', 35)).toBe('No hot water')
  })

  it('uses list max when larger', () => {
    const s =
      'Naman in Unit 25 reports that the hallway light is out and the front door will not latch properly'
    const t = clampBriefDescription(s, 100)
    expect(t.length).toBeLessThanOrEqual(100)
    expect(t.endsWith(' ')).toBe(false)
  })
})
