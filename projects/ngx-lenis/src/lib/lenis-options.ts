import type { LenisOptions } from 'lenis';

import { NGX_LENIS_OPTION_KEYS, type NgxLenisOptions } from './options';

/** Defaults matching the portfolio SmoothScroll service, plus Lenis autoRaf. */
export function toLenisOptions(config: NgxLenisOptions): LenisOptions {
  const lenis: Record<string, unknown> = { lerp: 0.09 };
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) continue;
    if ((NGX_LENIS_OPTION_KEYS as readonly string[]).includes(key)) continue;
    lenis[key] = value;
  }
  if (lenis['autoRaf'] === undefined) {
    lenis['autoRaf'] = config.syncGsap ? false : true;
  }
  return lenis as LenisOptions;
}
