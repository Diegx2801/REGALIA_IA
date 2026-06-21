import { HttpInterceptorFn } from '@angular/common/http';

interface StoredSession {
  token: string;
  tokenType?: string;
  expiresAt: number;
}

const SESSION_STORAGE_KEY = 'regalia_session';
const PUBLIC_ENDPOINTS = ['/api/auth/login'];

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
  const isPublicEndpoint = PUBLIC_ENDPOINTS.some((endpoint) => request.url.startsWith(endpoint));

  if (!isApiRequest || isPublicEndpoint || request.headers.has('Authorization')) {
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
