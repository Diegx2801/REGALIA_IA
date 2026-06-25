import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../../../config/api.config';
import { ApiResponse } from '../../../../shared/models/api-response.model';

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

  getCurrentProfile(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(API_ENDPOINTS.users.me);
  }

  updateCurrentProfile(request: UpdateUserProfileRequest): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(API_ENDPOINTS.users.me, request);
  }
}
