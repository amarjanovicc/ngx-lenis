# ngx-lenis

Angular adapter for [Lenis](https://github.com/darkroomengineering/lenis) — SSR-safe init, `prefers-reduced-motion` fallback to native scroll, optional GSAP ticker / ScrollTrigger sync, router reset, and signals for scroll progress.

This is a **local draft**. It is not published to npm and has no GitHub repository yet. Official Lenis already ships `lenis/react`, `lenis/vue`, and `lenis/framer`, but not an Angular adapter. Before a public release, consider offering this as `lenis/angular` to [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis).

Peer dependencies: Angular 20+, `lenis`. Optional: `gsap` (only if you set `syncGsap: true`).

## Install

```bash
npm i ngx-lenis lenis
# optional, for ScrollTrigger sync:
npm i gsap
```

Import the official Lenis stylesheet once, for example in `styles.css`:

```css
@import 'lenis/dist/lenis.css';
```

## Usage

```ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideLenis } from 'ngx-lenis';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideLenis({
      lerp: 0.09,          // forwarded to Lenis (default 0.09)
      syncGsap: true,      // optional; requires the `gsap` peer
      scrollOffset: -80,   // offset for selector/element scrollTo
      resetOnNavigation: true,
    }),
  ],
};
```

```ts
import { Component, inject } from '@angular/core';
import { LenisService } from 'ngx-lenis';

@Component({
  selector: 'app-nav',
  template: `
    <button type="button" (click)="lenis.scrollTo('#work')">Work</button>
    <span>{{ lenis.progress() }}</span>
  `,
})
export class Nav {
  protected readonly lenis = inject(LenisService);

  openMenu(): void {
    this.lenis.lock();
  }

  closeMenu(): void {
    this.lenis.unlock();
  }
}
```

`LenisService` exposes:

- `scrollTo(target, options?)` — y position, selector, or element
- `lock()` / `unlock()` / `setLocked(boolean)`
- `resetForNavigation()` — jump to top and refresh ScrollTrigger
- `init()` / `destroy()` — `provideLenis()` starts after the first browser render; destroy runs automatically
- Signals: `scrollY`, `progress`, `locked`, `reducedMotion`, `ready`, `usingLenis`
- `instance` — the underlying `Lenis` object, when one was created

Pass any [Lenis constructor option](https://github.com/darkroomengineering/lenis) through `provideLenis()` (`lerp`, `wheelMultiplier`, `orientation`, …). Angular-only keys (`autoStart`, `syncGsap`, `scrollOffset`, `resetOnNavigation`, `ignoreReducedMotion`) are not forwarded.

### Reduced motion

By default, if `(prefers-reduced-motion: reduce)` matches, Lenis is **not** started. `scrollTo` uses `window.scrollTo` / `scrollIntoView` with `behavior: 'auto'`, and `lock()` sets `overflow: hidden` on `<html>`. This is stricter than Lenis’s own `respectReducedMotion` (which keeps the instance running but disables smoothing). Set `ignoreReducedMotion: true` to start Lenis anyway.

## SSR and Zone.js

Init is a no-op on the server. The service waits for `afterNextRender` in the browser, so it is safe to call `provideLenis()` in an SSR / hydrated app. `scrollTo`, `lock`, and `resetForNavigation` also no-op until `init()` has run.

### Zone.js (`preventDefault` inside a passive listener)

If the app still uses Zone.js, Lenis can log `Unable to preventDefault inside passive event listener` because Zone patches `scroll` and `wheel`. Add this **before** `import 'zone.js'` (typically at the top of `src/polyfills.ts`):

```ts
import { unpatchLenisZoneEvents } from 'ngx-lenis';
unpatchLenisZoneEvents();
// then: import 'zone.js';
```

Calling the helper from `main.ts` is too late once Zone.js is already loaded. Zoneless apps (Angular 20+ default in many new workspaces, including this demo) can ignore the helper. See [Lenis discussion #176](https://github.com/darkroomengineering/lenis/discussions/176).

## Comparison with alternatives

| Package | Role | Notes (npm, late 2026) |
| --- | --- | --- |
| **`lenis`** | Core smooth-scroll library | ~2.7M weekly downloads. Official adapters for React, Vue, Framer — **not Angular**. |
| **`ngx-lenis` (this package)** | Focused Angular adapter | SSR, reduced-motion native fallback, optional GSAP ticker, router reset, signals. |
| `@hive-academy/angular-gsap` | GSAP scroll-animation kit that also wraps Lenis | ~9k monthly downloads; last publish July 2026, originally targeting Angular 20. |
| `@code_with_sachin/ngx-gsap` | Declarative GSAP + Lenis directives | Published November 2026; still very early (~hundreds of monthly downloads). |
| `ngx-gsap`, `ng-gsap` | Signals-first GSAP helpers | Little or no Lenis focus; very low download counts. |
| `@boatzako/ngx-smooth-scroll`, `@eunsatio/ngx-smooth-scroll` | Older Angular smooth-scroll wrappers | Last updates 2021–2022, Angular 7–13 peers. Not Lenis. |

Use this package if you want Lenis itself in an Angular 20+ (including SSR) app. Use a GSAP directive kit if you primarily want declarative ScrollTrigger presets and only need Lenis as an implementation detail.

## Local workspace

```bash
npm install
npm test          # library unit tests
npm run build     # ng-packagr / Angular library build → dist/ngx-lenis
npm start         # demo app at http://localhost:4200
npm run build:demo
```

Nothing in this draft is set up to publish or push.

## License

[MIT](LICENSE) © Adam Marjanović
