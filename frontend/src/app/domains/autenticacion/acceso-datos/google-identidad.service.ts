import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { GOOGLE_AUTH_CONFIG } from '../../../core/configuracion/google-auth.config';

const GOOGLE_SCRIPT_ID = 'google-identity-services-script';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleIdentityInitializeConfig {
  client_id: string;
  callback: (respuesta: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  ux_mode?: 'popup' | 'redirect';
}

interface GoogleButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  locale?: string;
  logo_alignment?: 'left' | 'center';
}

interface GoogleRenderOptions {
  text?: GoogleButtonOptions['text'];
  mostrarCuentaGoogle?: boolean;
}

interface GoogleAccountsId {
  initialize(configuracion: GoogleIdentityInitializeConfig): void;
  renderButton(contenedor: HTMLElement, opciones: GoogleButtonOptions): void;
  disableAutoSelect(): void;
}

interface GoogleIdentityApi {
  accounts: {
    id: GoogleAccountsId;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentidadService {
  private readonly document = inject(DOCUMENT);
  private cargaScript?: Promise<void>;

  renderizarBoton(
    contenedor: HTMLElement,
    callbacks: {
      onCredential: (idToken: string) => void;
      onError: (mensaje: string) => void;
    },
    opciones?: GoogleRenderOptions,
  ): void {
    this.cargarScript()
      .then(() => {
        const googleId = window.google?.accounts?.id;

        if (!googleId) {
          callbacks.onError('No se pudo cargar el inicio con Google.');
          return;
        }

        contenedor.innerHTML = '';
        googleId.initialize({
          client_id: GOOGLE_AUTH_CONFIG.clientId,
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (respuesta) => {
            if (!respuesta.credential) {
              callbacks.onError('Google no devolvio una identidad valida.');
              return;
            }

            callbacks.onCredential(respuesta.credential);
          },
        });

        const mostrarCuentaGoogle = opciones?.mostrarCuentaGoogle ?? true;

        googleId.renderButton(contenedor, {
          theme: 'outline',
          size: mostrarCuentaGoogle ? 'large' : 'medium',
          text: opciones?.text ?? 'continue_with',
          shape: 'pill',
          width: mostrarCuentaGoogle ? 320 : 190,
          locale: 'es',
          logo_alignment: 'left',
        });
      })
      .catch(() => callbacks.onError('No se pudo cargar el inicio con Google.'));
  }

  // Limpia la seleccion automatica de Google al cerrar sesion en REGALIA.
  // No cierra la cuenta Google del navegador; solo evita reutilizar la ultima cuenta sin contexto.
  limpiarSeleccionAutomatica(): void {
    window.google?.accounts?.id?.disableAutoSelect();
  }

  private cargarScript(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (this.cargaScript) return this.cargaScript;

    this.cargaScript = new Promise((resolve, reject) => {
      const scriptExistente = this.document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;

      if (scriptExistente) {
        scriptExistente.addEventListener('load', () => resolve(), { once: true });
        scriptExistente.addEventListener('error', () => reject(), { once: true });
        return;
      }

      const script = this.document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = GOOGLE_AUTH_CONFIG.scriptSrc;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(), { once: true });

      this.document.head.appendChild(script);
    });

    return this.cargaScript;
  }
}
