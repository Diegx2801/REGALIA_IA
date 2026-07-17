import { Injectable } from '@angular/core';
import { SesionAutenticacion } from './sesion-autenticacion.model';

const CLAVE_SESION = 'regalia_sesion';

@Injectable({ providedIn: 'root' })
export class AlmacenamientoAutenticacionService {
  // Persistencia de sesion: localStorage solo cuando el usuario decide recordar sesion.
  obtenerSesion(): SesionAutenticacion | null {
    const valor = localStorage.getItem(CLAVE_SESION) ?? sessionStorage.getItem(CLAVE_SESION);
    if (!valor) return null;

    try {
      const sesion = JSON.parse(valor) as SesionAutenticacion;
      if (this.sesionEstaExpirada(sesion)) {
        this.limpiarSesion();
        return null;
      }

      return sesion;
    } catch {
      this.limpiarSesion();
      return null;
    }
  }

  guardarSesion(sesion: SesionAutenticacion, recordar: boolean): void {
    const destino = recordar ? localStorage : sessionStorage;
    this.limpiarSesion();
    destino.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }

  actualizarSesion(sesion: SesionAutenticacion): void {
    const destino = localStorage.getItem(CLAVE_SESION) !== null ? localStorage : sessionStorage;
    destino.setItem(CLAVE_SESION, JSON.stringify(sesion));
  }

  limpiarSesion(): void {
    localStorage.removeItem(CLAVE_SESION);
    sessionStorage.removeItem(CLAVE_SESION);
  }

  private sesionEstaExpirada(sesion: SesionAutenticacion): boolean {
    return Boolean(sesion.expiraEn) && Date.now() >= sesion.expiraEn;
  }
}
