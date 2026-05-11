import { describe, it, expect } from 'vitest'
import { clampBriefDescription } from './brief-clamp'

describe('clampBriefDescription', () => {
  it('returns model output unchanged when within max', () => {
    expect(clampBriefDescription('Hall light + door latch', 35)).toBe('Hall light + door latch')
  })

  it('when over max, backs up to last space if reasonable', () => {
    expect(clampBriefDescription('Hallway light out & door not latching', 35)).toBe(
      'Hallway light out & door not'
    )
  })

  it('returns short strings unchanged', () => {
    expect(clampBriefDescription('No hot water', 35)).toBe('No hot water')
  })

  it('when over max and no space in prefix, hard trims', () => {
    expect(clampBriefDescription('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJ', 20)).toHaveLength(20)
  })
})
