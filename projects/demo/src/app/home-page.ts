import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { LenisService } from 'ngx-lenis';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, DecimalPipe],
  template: `
    <header class="bar">
      <strong>ngx-lenis demo</strong>
      <span>scroll {{ lenis.scrollY() | number: '1.0-0' }} · progress {{ lenis.progress() | number: '1.2-2' }}</span>
      <span>{{ lenis.usingLenis() ? 'Lenis' : lenis.reducedMotion() ? 'reduced motion' : 'native' }}</span>
      <button type="button" (click)="lenis.scrollTo('#work')">Scroll to work</button>
      <button type="button" (click)="toggleLock()">
        {{ lenis.locked() ? 'Unlock' : 'Lock' }} scroll
      </button>
      <a routerLink="/other">Other page</a>
    </header>

    <section id="intro" class="panel tone-a">
      <h1>Smooth scroll for Angular</h1>
      <p>This demo boots Lenis through <code>provideLenis()</code>. The service is SSR-safe and falls back to native scrolling when the user prefers reduced motion.</p>
    </section>

    <section id="work" class="panel tone-b">
      <h2>Work</h2>
      <p>Use the header button or this one to jump around.</p>
      <button type="button" (click)="lenis.scrollTo(0)">Back to top</button>
    </section>

    <section id="about" class="panel tone-c">
      <h2>About</h2>
      <p>Navigating to the other page should reset the scroll position.</p>
    </section>
  `,
})
export class HomePage {
  protected readonly lenis = inject(LenisService);

  protected toggleLock(): void {
    this.lenis.setLocked(!this.lenis.locked());
  }
}
