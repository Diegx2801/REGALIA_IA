import { Injectable } from '@angular/core';
import { SESSION_STORAGE_KEY } from '../../config/session-storage.config';
import { SessionUser } from './auth-session.model';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  read(): SessionUser | null {
    const rawSession =
      localStorage.getItem(SESSION_STORAGE_KEY) ?? sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!rawSession) return null;

    try {
      const session = JSON.parse(rawSession) as SessionUser;

      if (!this.isValidSession(session)) {
        this.clear();
        return null;
      }

      return session;
    } catch {
      this.clear();
      return null;
    }
  }

  save(session: SessionUser, remember: boolean): void {
    this.clear();

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  isPersistent(): boolean {
    return localStorage.getItem(SESSION_STORAGE_KEY) !== null;
  }

  private isValidSession(session: SessionUser): boolean {
    return Boolean(session.token && session.authContext && session.expiresAt > Date.now());
  }
}
