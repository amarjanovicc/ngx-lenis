import { describe, expect, it } from 'vitest';

import { toLenisOptions } from './lenis-options';

describe('toLenisOptions', () => {
  it('forwards Lenis options and strips Angular-only keys', () => {
    const result = toLenisOptions({
      lerp: 0.2,
      wheelMultiplier: 1.2,
      autoStart: false,
      syncGsap: false,
      scrollOffset: -40,
      resetOnNavigation: false,
      ignoreReducedMotion: true,
    });
    expect(result).toEqual({
      lerp: 0.2,
      wheelMultiplier: 1.2,
      autoRaf: true,
    });
  });

  it('disables autoRaf when syncing with GSAP unless overridden', () => {
    expect(toLenisOptions({ syncGsap: true }).autoRaf).toBe(false);
    expect(toLenisOptions({ syncGsap: true, autoRaf: true }).autoRaf).toBe(true);
  });

  it('defaults lerp to 0.09', () => {
    expect(toLenisOptions({}).lerp).toBe(0.09);
  });
});
