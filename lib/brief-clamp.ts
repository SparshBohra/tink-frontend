/**
 * Yardi brief etc. must not exceed `max` characters.
 * If the model runs over, prefer backing up to the last space so we do not end on a fragment
 * (the prompt should already keep text within limits and end on whole words).
 */
export function clampBriefDescription(input: string, max = 35): string {
  const t = (input || '').trim()
  if (t.length <= max) return t

  const cut = t.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  const minPrefix = Math.max(8, Math.floor(max * 0.35))
  if (lastSpace >= minPrefix) {
    return cut.slice(0, lastSpace).trimEnd()
  }
  return cut.trimEnd()
}
