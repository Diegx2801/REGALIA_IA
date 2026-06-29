import { Injectable } from '@angular/core';
import {
  ADMIN_SESSION_STORAGE_KEY,
  LEGACY_SESSION_STORAGE_KEY,
  PUBLIC_SESSION_STORAGE_KEY,
} from '../../config/session-storage.config';
import { AuthContext, SessionUser } from './auth-session.model';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  read(context: AuthContext): SessionUser | null {
    const key = this.keyForContext(context);
    const rawSession = localStorage.getItem(key) ?? sessionStorage.getItem(key);

    if (!rawSession) {
      this.clearLegacyIfPresent();
      return null;
    }

    try {
      const session = JSON.parse(rawSession) as SessionUser;

      if (!this.isValidSession(session, context)) {
        this.clear(context);
        return null;
      }

      return session;
    } catch {
      this.clear(context);
      return null;
    }
  }

  save(session: SessionUser, remember: boolean): void {
    this.clear(session.authContext);

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.keyForContext(session.authContext), JSON.stringify(session));
    this.clearLegacyIfPresent();
  }

  clear(context?: AuthContext): void {
    if (context) {
      this.removeFromBothStorages(this.keyForContext(context));
      return;
    }

    this.removeFromBothStorages(PUBLIC_SESSION_STORAGE_KEY);
    this.removeFromBothStorages(ADMIN_SESSION_STORAGE_KEY);
    this.removeFromBothStorages(LEGACY_SESSION_STORAGE_KEY);
  }

  isPersistent(context: AuthContext): boolean {
    return localStorage.getItem(this.keyForContext(context)) !== null;
  }

  private keyForContext(context: AuthContext): string {
    return context === 'ADMIN' ? ADMIN_SESSION_STORAGE_KEY : PUBLIC_SESSION_STORAGE_KEY;
  }

  private removeFromBothStorages(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  private clearLegacyIfPresent(): void {
    this.removeFromBothStorages(LEGACY_SESSION_STORAGE_KEY);
  }

  private isValidSession(session: SessionUser, expectedContext: AuthContext): boolean {
    return Boolean(
      session.token &&
        session.authContext === expectedContext &&
        session.expiresAt > Date.now(),
    );
  }
}
