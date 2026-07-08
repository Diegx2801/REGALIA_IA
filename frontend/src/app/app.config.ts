import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // PETICIONES HTTP: HttpClient queda disponible globalmente y usa el interceptor de token.
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    // ROUTING: provideRouter conecta la navegacion de toda la app con app.routes.ts.
    provideRouter(routes),
  ],
};
