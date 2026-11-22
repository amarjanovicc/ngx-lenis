import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LenisService } from './lenis.service';
import { provideLenis } from './provide-lenis';

type FakeLenis = {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  scrollTo: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  raf: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  scroll: number;
  progress: number;
};

const lenisCtor = vi.fn();

vi.mock('lenis', () => ({
  default: class {
    constructor(options: unknown) {
      return lenisCtor(options);
    }
  },
}));

function createFakeLenis(): FakeLenis {
  const listeners = new Map<string, (instance: FakeLenis) => void>();
  const instance: FakeLenis = {
    on: vi.fn((event: string, cb: (instance: FakeLenis) => void) => {
      listeners.set(event, cb);
      return () => listeners.delete(event);
    }),
    off: vi.fn(),
    scrollTo: vi.fn(),
    stop: vi.fn(),
    start: vi.fn(),
    raf: vi.fn(),
    destroy: vi.fn(),
    scroll: 0,
    progress: 0,
  };
  return instance;
}

function mockMatchMedia(reduced: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe('LenisService', () => {
  let fake: FakeLenis;

  beforeEach(() => {
    fake = createFakeLenis();
    lenisCtor.mockReset();
    lenisCtor.mockReturnValue(fake);
    mockMatchMedia(false);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setup(
    options: Parameters<typeof provideLenis>[0] = {},
    extra: { platform?: string; router?: { events: Subject<unknown> } } = {},
  ) {
    const providers: unknown[] = [
      provideLenis({ autoStart: false, ...options }),
      { provide: PLATFORM_ID, useValue: extra.platform ?? 'browser' },
    ];
    if (extra.router) {
      providers.push({ provide: Router, useValue: extra.router });
    }
    TestBed.configureTestingModule({ providers: providers as never[] });
    return TestBed.inject(LenisService);
  }

  it('is a no-op on the server: init, scrollTo, lock and reset do not construct Lenis', () => {
    const service = setup({}, { platform: 'server' });

    service.init();
    service.scrollTo(240);
    service.setLocked(true);
    service.lock();
    service.resetForNavigation();

    expect(lenisCtor).not.toHaveBeenCalled();
    expect(service.ready()).toBe(false);
    expect(service.usingLenis()).toBe(false);
    expect(service.instance).toBeUndefined();
    expect(service.locked()).toBe(false);
  });

  it('falls back to native scroll when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);
    const service = setup();
    const nativeScrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    service.init();

    expect(lenisCtor).not.toHaveBeenCalled();
    expect(service.ready()).toBe(true);
    expect(service.reducedMotion()).toBe(true);
    expect(service.usingLenis()).toBe(false);

    service.scrollTo(120);
    expect(nativeScrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'auto' });

    service.setLocked(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(service.locked()).toBe(true);

    service.unlock();
    expect(document.documentElement.style.overflow).toBe('');
    expect(service.locked()).toBe(false);

    nativeScrollTo.mockRestore();
  });

  it('uses scrollIntoView for selector targets on the reduced-motion path', () => {
    mockMatchMedia(true);
    const service = setup();
    const target = document.createElement('section');
    target.id = 'work';
    const intoView = vi.fn();
    target.scrollIntoView = intoView;
    document.body.appendChild(target);

    service.init();
    service.scrollTo('#work');

    expect(intoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    target.remove();
  });

  it('starts Lenis in the browser and wires scroll signals, scrollTo, lock and destroy', () => {
    const service = setup({ lerp: 0.09 });

    service.init();

    expect(lenisCtor).toHaveBeenCalledTimes(1);
    const passed = lenisCtor.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(passed['lerp']).toBe(0.09);
    expect(passed['autoRaf']).toBe(true);
    expect(passed['autoStart']).toBeUndefined();
    expect(service.ready()).toBe(true);
    expect(service.usingLenis()).toBe(true);
    expect(service.instance).toBe(fake as never);
    expect(fake.on).toHaveBeenCalled();

    service.scrollTo(400);
    expect(fake.scrollTo).toHaveBeenCalledWith(400, expect.objectContaining({ offset: 0, immediate: false }));

    service.scrollTo('#about');
    expect(fake.scrollTo).toHaveBeenCalledWith('#about', expect.objectContaining({ offset: -80 }));

    service.lock();
    expect(fake.stop).toHaveBeenCalled();
    expect(service.locked()).toBe(true);
    service.unlock();
    expect(fake.start).toHaveBeenCalled();
    expect(service.locked()).toBe(false);

    service.destroy();
    expect(fake.destroy).toHaveBeenCalled();
    expect(service.instance).toBeUndefined();
    expect(service.usingLenis()).toBe(false);
    expect(service.ready()).toBe(false);
  });

  it('resets to the top on NavigationEnd after init', () => {
    const events = new Subject<unknown>();
    const service = setup({ resetOnNavigation: true }, { router: { events } });
    service.init();

    events.next(new NavigationEnd(1, '/a', '/a'));

    expect(fake.scrollTo).toHaveBeenCalledWith(0, { immediate: true });
  });

  it('does not start Lenis twice', () => {
    const service = setup();
    service.init();
    service.init();
    expect(lenisCtor).toHaveBeenCalledTimes(1);
  });

  it('does not construct Lenis when init is never called (autoStart false)', () => {
    setup({ autoStart: false });
    expect(lenisCtor).not.toHaveBeenCalled();
  });
});
