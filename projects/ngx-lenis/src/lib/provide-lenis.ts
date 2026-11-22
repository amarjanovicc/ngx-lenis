import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

import { LenisService } from './lenis.service';
import { NGX_LENIS_OPTIONS, type NgxLenisOptions } from './options';

/**
 * Provide `LenisService` and configure ngx-lenis for the current injector.
 *
 * @example
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideLenis({ lerp: 0.09, syncGsap: true }),
 *   ],
 * };
 * ```
 */
export function provideLenis(options: NgxLenisOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NGX_LENIS_OPTIONS, useValue: options },
    LenisService,
  ]);
}
