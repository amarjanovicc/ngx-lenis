/**
 * Mark `scroll` and `wheel` as unpatched Zone.js events.
 *
 * Must run *before* Zone.js is imported (e.g. at the top of `polyfills.ts`).
 * Calling this from `main.ts` is too late if Zone.js is already loaded.
 * Zoneless applications can ignore this helper.
 *
 * @see https://github.com/darkroomengineering/lenis/discussions/176
 */
export function unpatchLenisZoneEvents(): void {
  if (typeof window === 'undefined') return;
  const key = '__zone_symbol__UNPATCHED_EVENTS';
  const current = ((window as unknown as Record<string, unknown>)[key] as string[] | undefined) ?? [];
  (window as unknown as Record<string, unknown>)[key] = [...new Set([...current, 'scroll', 'wheel'])];
}
