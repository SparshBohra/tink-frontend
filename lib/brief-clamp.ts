/**
 * External work-order "Brief description" fields are often capped at 35 characters.
 * A hard slice mid-word reads badly in the app list; prefer breaking on the last space.
 */
export function clampBriefDescription(input: string, max = 35): string {
  const t = (input || '').trim()
  if (t.length <= max) return t

  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const minKeep = Math.min(12, Math.floor(max / 2))

  if (lastSpace >= minKeep) {
    return cut.slice(0, lastSpace).trimEnd()
  }

  return cut.trimEnd()
}
