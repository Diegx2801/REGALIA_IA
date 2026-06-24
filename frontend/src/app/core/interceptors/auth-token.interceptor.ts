import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

interface StoredSession {
  token: string;
  tokenType?: string;
  expiresAt: number;
}

interface PublicEndpoint {
  method: string;
  url: string;
}

const SESSION_STORAGE_KEY = 'regalia_session';

const PUBLIC_ENDPOINTS: PublicEndpoint[] = [
  { method: 'POST', url: '/api/auth/login' },
  { method: 'POST', url: '/api/admin/auth/login' },
  { method: 'POST', url: '/api/usuarios' },
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

function readStoredSession(): StoredSession | null {
  const rawSession =
    localStorage.getItem(SESSION_STORAGE_KEY) ?? sessionStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as StoredSession;

    if (!session.token || session.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith('/api');

  if (!isApiRequest || isPublicEndpoint(request) || request.headers.has('Authorization')) {
    return next(request);
  }

  const session = readStoredSession();
  if (!session) return next(request);

  return next(
    request.clone({
      setHeaders: {
        Authorization: `${session.tokenType || 'Bearer'} ${session.token}`,
      },
    }),
  );
};