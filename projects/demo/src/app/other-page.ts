import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-other-page',
  imports: [RouterLink],
  template: `
    <header class="bar">
      <strong>Other page</strong>
      <a routerLink="/">Back home</a>
    </header>
    <section class="panel tone-a">
      <h1>Route changed</h1>
      <p>ngx-lenis should have jumped to the top on <code>NavigationEnd</code>.</p>
    </section>
    <section class="panel tone-b">
      <h2>Still scrollable</h2>
      <p>Just enough height to confirm reset on the way here and back.</p>
    </section>
  `,
})
export class OtherPage {}
