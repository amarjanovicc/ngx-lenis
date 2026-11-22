import { describe, expect, it, afterEach } from 'vitest';

import { unpatchLenisZoneEvents } from './unpatch-zone';

describe('unpatchLenisZoneEvents', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>)['__zone_symbol__UNPATCHED_EVENTS'];
  });

  it('registers scroll and wheel as unpatched Zone.js events', () => {
    unpatchLenisZoneEvents();
    const events = (window as unknown as Record<string, unknown>)[
      '__zone_symbol__UNPATCHED_EVENTS'
    ] as string[];
    expect(events).toEqual(expect.arrayContaining(['scroll', 'wheel']));
  });

  it('preserves existing unpatched events', () => {
    (window as unknown as Record<string, unknown>)['__zone_symbol__UNPATCHED_EVENTS'] = ['click'];
    unpatchLenisZoneEvents();
    const events = (window as unknown as Record<string, unknown>)[
      '__zone_symbol__UNPATCHED_EVENTS'
    ] as string[];
    expect(events).toEqual(expect.arrayContaining(['click', 'scroll', 'wheel']));
  });
});
