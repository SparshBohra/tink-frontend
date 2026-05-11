import { describe, it, expect } from 'vitest'
import { clampBriefDescription } from './brief-clamp'

describe('clampBriefDescription', () => {
  it('caps at 35 without word-aware trimming', () => {
    expect(clampBriefDescription('Hallway light out & door not latching', 35)).toBe(
      'Hallway light out & door not latchi'
    )
    expect(clampBriefDescription('Hallway light out & door not latching', 35).length).toBe(35)
  })

  it('returns short strings unchanged', () => {
    expect(clampBriefDescription('No hot water', 35)).toBe('No hot water')
  })

  it('caps at 100 when input is longer', () => {
    const s =
      'Naman in Unit 25 reports that the hallway light is out and the front door will not latch properly. ' +
      'Please send someone this week if possible.'
    expect(s.length).toBeGreaterThan(100)
    const t = clampBriefDescription(s, 100)
    expect(t.length).toBe(100)
  })
})
