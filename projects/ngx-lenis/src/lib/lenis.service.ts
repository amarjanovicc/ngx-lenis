import {
  afterNextRender,
  DestroyRef,
  EnvironmentInjector,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import Lenis from 'lenis';
import type { ScrollToOptions } from 'lenis';

import { loadGsapBridge, type GsapBridge } from './gsap-sync';
import { toLenisOptions } from './lenis-options';
import { NGX_LENIS_OPTIONS } from './options';
import { prefersReducedMotion } from './reduced-motion';

/**
 * SSR-safe Lenis wrapper. Logic adapted from the SmoothScroll service in
 * amarjanovicc/portfolio (`apps/web/src/app/core/motion/smooth-scroll.ts`).
 *
 * Provide via `provideLenis()`. Init runs after the first browser render and
 * is a no-op on the server. When the user prefers reduced motion, Lenis is
 * not started and `scrollTo` falls back to native scrolling.
 */
@Injectable()
export class LenisService {
  private readonly config = inject(NGX_LENIS_OPTIONS);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(EnvironmentInjector);
  private readonly router = inject(Router, { optional: true });

  private lenis?: Lenis;
  private gsap?: GsapBridge;
  private started = false;
  private readonly cleanups: Array<() => void> = [];

  /** Current scroll position in pixels (Lenis or native). */
  readonly scrollY = signal(0);
  /** Scroll progress in the range `[0, 1]`. */
  readonly progress = signal(0);
  /** Whether scrolling is locked (`stop()` / overflow hidden). */
  readonly locked = signal(false);
  /** Whether `prefers-reduced-motion: reduce` was detected at init. */
  readonly reducedMotion = signal(false);
  /** True after browser `init()` has run (including the reduced-motion path). */
  readonly ready = signal(false);
  /** True when a Lenis instance is active. */
  readonly usingLenis = signal(false);

  /** The underlying Lenis instance, if one was created. */
  get instance(): Lenis | undefined {
    return this.lenis;
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroy());
    this.bindRouter();
    if (this.config.autoStart === false) return;
    if (!isPlatformBrowser(this.platformId)) return;
    afterNextRender(() => this.init(), { injector: this.injector });
  }

  /**
   * Create the Lenis instance (or the native reduced-motion fallback).
   * Safe to call more than once; no-op on the server.
   */
  init(): void {
    if (this.started) return;
    if (!isPlatformBrowser(this.platformId)) return;
    this.started = true;

    const reduced = prefersReducedMotion();
    this.reducedMotion.set(reduced);
    if (reduced && !this.config.ignoreReducedMotion) {
      this.bindNativeScroll();
      this.ready.set(true);
      return;
    }

    void this.startLenis();
  }

  /**
   * Smooth-scroll to a y position, CSS selector, or element.
   * Falls back to native scrolling when Lenis was skipped. No-op during SSR.
   */
  scrollTo(target: number | string | HTMLElement, options: ScrollToOptions = {}): void {
    if (!isPlatformBrowser(this.platformId) || !this.started) return;
    const immediate = options.immediate ?? this.reducedMotion();
    if (this.lenis) {
      const offset =
        options.offset ?? (typeof target === 'number' ? 0 : (this.config.scrollOffset ?? -80));
      this.lenis.scrollTo(target, { ...options, offset, immediate });
      return;
    }
    const behavior: ScrollBehavior = immediate ? 'auto' : 'smooth';
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior });
      return;
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior, block: 'start' });
  }

  /** Freeze scrolling (e.g. while a full-screen menu is open). Browser-only. */
  setLocked(locked: boolean): void {
    if (!isPlatformBrowser(this.platformId) || !this.started) return;
    if (this.lenis) {
      if (locked) this.lenis.stop();
      else this.lenis.start();
    } else {
      document.documentElement.style.overflow = locked ? 'hidden' : '';
    }
    this.locked.set(locked);
  }

  lock(): void {
    this.setLocked(true);
  }

  unlock(): void {
    this.setLocked(false);
  }

  /** Jump to top on navigation and re-measure ScrollTrigger for the new page. */
  resetForNavigation(): void {
    if (!isPlatformBrowser(this.platformId) || !this.started) return;
    if (this.lenis) {
      this.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (this.gsap) {
      requestAnimationFrame(() => this.gsap?.refresh());
    }
  }

  /** Tear down Lenis, GSAP hooks, and listeners. Called automatically on destroy. */
  destroy(): void {
    for (const fn of this.cleanups.splice(0)) {
      fn();
    }
    this.lenis?.destroy();
    this.lenis = undefined;
    this.gsap = undefined;
    this.usingLenis.set(false);
    if (this.locked()) {
      if (isPlatformBrowser(this.platformId)) {
        document.documentElement.style.overflow = '';
      }
      this.locked.set(false);
    }
    this.started = false;
    this.ready.set(false);
  }

  private async startLenis(): Promise<void> {
    const options = toLenisOptions(this.config);
    this.lenis = new Lenis(options);

    const onScroll = (instance: Lenis) => {
      this.scrollY.set(instance.scroll);
      this.progress.set(instance.progress);
      this.gsap?.onScroll();
    };
    const offScroll = this.lenis.on('scroll', onScroll);
    this.cleanups.push(offScroll);
    onScroll(this.lenis);

    if (this.config.syncGsap) {
      this.gsap = (await loadGsapBridge()) ?? undefined;
      if (this.gsap && this.lenis) {
        const detach = this.gsap.attach(this.lenis);
        this.cleanups.push(detach);
      } else if (this.config.syncGsap && !this.gsap) {
        console.warn(
          'ngx-lenis: syncGsap is true but the optional peer "gsap" could not be loaded. Falling back to autoRaf.',
        );
        // autoRaf was forced off for the GSAP ticker; start a rAF loop instead.
        this.startRaf();
      }
    }

    this.usingLenis.set(true);
    this.ready.set(true);
  }

  private startRaf(): void {
    let id = 0;
    const loop = (time: number) => {
      this.lenis?.raf(time);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    this.cleanups.push(() => cancelAnimationFrame(id));
  }

  private bindNativeScroll(): void {
    const update = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const limit = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      this.scrollY.set(y);
      this.progress.set(Math.min(1, Math.max(0, y / limit)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    this.cleanups.push(() => window.removeEventListener('scroll', update));
  }

  private bindRouter(): void {
    if (this.config.resetOnNavigation === false || !this.router) return;
    const sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.resetForNavigation();
    });
    this.cleanups.push(() => sub.unsubscribe());
  }
}
