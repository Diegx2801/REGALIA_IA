import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../auth/auth-session.service';

export interface UserProfile {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface UpdateUserProfileRequest {
  nombres: string;
  apellidos: string;
  telefono: string;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/usuarios/me';

  getCurrentProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(this.endpoint);
  }

  updateCurrentProfile(request: UpdateUserProfileRequest): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(this.endpoint, request);
  }
}
