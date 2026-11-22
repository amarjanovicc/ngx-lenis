import { InjectionToken } from '@angular/core';
import type { LenisOptions, ScrollToOptions } from 'lenis';

/**
 * Angular-specific options plus the Lenis constructor options they wrap.
 * Fields listed in `NGX_LENIS_OPTION_KEYS` are not forwarded to `new Lenis()`.
 */
export interface NgxLenisOptions extends LenisOptions {
  /**
   * Start Lenis (or the native reduced-motion fallback) after the first
   * browser render. Default `true`.
   */
  autoStart?: boolean;
  /**
   * Drive Lenis from the GSAP ticker and call `ScrollTrigger.update` on
   * scroll. Requires the optional peer dependency `gsap`. Default `false`.
   */
  syncGsap?: boolean;
  /**
   * Offset in pixels applied when `scrollTo` receives a selector or element.
   * Default `-80`.
   */
  scrollOffset?: number;
  /**
   * Jump to the top and refresh ScrollTrigger on Angular `NavigationEnd`.
   * Default `true` when a `Router` is available.
   */
  resetOnNavigation?: boolean;
  /**
   * Start Lenis even when the user prefers reduced motion.
   * Default `false` (native `window` scrolling is used instead).
   */
  ignoreReducedMotion?: boolean;
}

export const NGX_LENIS_OPTION_KEYS = [
  'autoStart',
  'syncGsap',
  'scrollOffset',
  'resetOnNavigation',
  'ignoreReducedMotion',
] as const;

export const NGX_LENIS_OPTIONS = new InjectionToken<NgxLenisOptions>('NGX_LENIS_OPTIONS');

export type { LenisOptions, ScrollToOptions };
