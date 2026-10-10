import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, RouteReuseStrategy } from '@angular/router';

import { routes, AppRoutingModule } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { HTTP_INTERCEPTORS, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { CustomRouteReuseStrategy } from './custom-route-reuse-strategy';
import { loaderInterceptor } from './loader.interceptor';
import { RatesCardComponent } from '../rates-card/rates-card.component';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { HotkeyOptions } from 'angular2-hotkeys';
import { MAT_DATE_LOCALE } from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCharts(withDefaultRegisterables()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(AppRoutingModule),
    provideClientHydration(),
    provideAnimationsAsync(),
    provideToastr({}),
    { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: HotkeyOptions, useValue: {} },


    // Provide HTTP Client with LoaderInterceptor
    provideHttpClient(
      withInterceptors([loaderInterceptor]) // Attach loader interceptor
    ),
    provideToastr({}), provideAnimationsAsync(),
  ],
};
