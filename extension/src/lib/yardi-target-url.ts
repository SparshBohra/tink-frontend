/** URL-only check (background can't read DOM). Kept aligned with `yardi-autofill.ts` `isYardiFillTargetPage`. */
export function isUrlLikelyYardiFillTarget(url: string): boolean {
  try {
    const u = new URL(url)
    const { hostname, pathname } = u
    if (
      hostname === 'app.squareft.ai' ||
      hostname === 'squareft.ai' ||
      hostname === 'www.squareft.ai'
    ) {
      if (pathname.includes('/dev/yardi-work-order-mock')) return true
    }
    if ((hostname === '127.0.0.1' || hostname === 'localhost') && pathname.includes('yardi-work-order-mock')) {
      return true
    }
    if (hostname.endsWith('elevate.cafe') && pathname.includes('facilitymanagernet')) {
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function findYardiFillTargetTabId(): Promise<number | undefined> {
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (active?.id && active.url && isUrlLikelyYardiFillTarget(active.url)) {
    return active.id
  }
  const tabs = await chrome.tabs.query({})
  for (const t of tabs) {
    if (t.id && t.url && isUrlLikelyYardiFillTarget(t.url)) {
      return t.id
    }
  }
  return undefined
}
