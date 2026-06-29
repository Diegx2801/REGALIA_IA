import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_ENDPOINTS, isApiRequestUrl } from '../config/api.config';
import { AuthStorageService } from '../services/auth/auth-storage.service';
import { AuthContext } from '../services/auth/auth-session.model';

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

function authContextForApiUrl(url: string): AuthContext {
  return normalizedUrl(url).startsWith('/api/admin') ? 'ADMIN' : 'PUBLIC';
}

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    !isApiRequestUrl(request.url) ||
    isPublicEndpoint(request) ||
    request.headers.has('Authorization')
  ) {
    return next(request);
  }

  const session = inject(AuthStorageService).read(authContextForApiUrl(request.url));
  if (!session) return next(request);

  return next(
    request.clone({
      setHeaders: {
        Authorization: `${session.tokenType || 'Bearer'} ${session.token}`,
      },
    }),
  );
};
