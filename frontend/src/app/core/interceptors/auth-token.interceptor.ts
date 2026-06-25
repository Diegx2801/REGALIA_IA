import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_ENDPOINTS, isApiRequestUrl } from '../config/api.config';
import { AuthStorageService } from '../services/auth/auth-storage.service';

interface PublicEndpoint {
  method: string;
  url: string;
}

const PUBLIC_ENDPOINTS: PublicEndpoint[] = [
  { method: 'POST', url: API_ENDPOINTS.auth.login },
  { method: 'POST', url: API_ENDPOINTS.auth.adminLogin },
  { method: 'POST', url: API_ENDPOINTS.auth.register },
];

function normalizedUrl(url: string): string {
  return url.split('?')[0];
}

function isPublicEndpoint(request: HttpRequest<unknown>): boolean {
  const url = normalizedUrl(request.url);

  return PUBLIC_ENDPOINTS.some(
    (endpoint) => request.method === endpoint.method && url === endpoint.url,
  );
}

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    !isApiRequestUrl(request.url) ||
    isPublicEndpoint(request) ||
    request.headers.has('Authorization')
  ) {
    return next(request);
  }

  const session = inject(AuthStorageService).read();
  if (!session) return next(request);

  return next(
    request.clone({
      setHeaders: {
        Authorization: `${session.tokenType || 'Bearer'} ${session.token}`,
      },
    }),
  );
};
