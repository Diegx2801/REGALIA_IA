import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { errorApiInterceptor } from './core/http/interceptors/error-api.interceptor';
import { tokenAutenticacionInterceptor } from './core/http/interceptors/token-autenticacion.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Angular moderno: la deteccion de cambios se activa sin zone.js mediante Signals/eventos.
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // HTTP global: los interceptores centralizan token JWT y errores de API.
    provideHttpClient(withInterceptors([tokenAutenticacionInterceptor, errorApiInterceptor])),
  ],
};
