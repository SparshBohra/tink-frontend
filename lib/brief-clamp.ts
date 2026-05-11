/** Strict character cap (e.g. Yardi brief = 35). Leading/trailing whitespace trimmed once; then slice to max. */
export function clampBriefDescription(input: string, max = 35): string {
  const t = (input || '').trim()
  return t.length <= max ? t : t.slice(0, max)
}
