import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';
import {
  UpdateUserProfileRequest,
  UserProfile,
  UserProfileService,
} from '../../core/services/data-access/user/user-profile.service';

@Component({
  // PATRON DECORATOR: @Component le agrega metadatos al perfil para que Angular lo renderice.
  selector: 'app-account-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './account-profile.html',
  styleUrl: './account-profile.css',
})
export class AccountProfileComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly userProfileService = inject(UserProfileService);

  readonly profile = signal<UserProfile | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly role = this.authSession.role;

  readonly initials = computed(() => {
    const profile = this.profile();
    const names = [profile?.nombres, profile?.apellidos].filter(Boolean).join(' ').trim();

    if (!names) return 'RG';

    return names
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  // PATRON FACTORY: FormBuilder crea el formulario reactivo siguiendo la estructura del perfil.
  readonly form = this.formBuilder.nonNullable.group({
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    telefono: ['', [Validators.maxLength(20), Validators.pattern(/^[0-9+()\-\s]{0,20}$/)]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userProfileService.getCurrentProfile().subscribe({
      next: ({ data }) => {
        this.profile.set(data);
        this.form.reset({
          nombres: data.nombres,
          apellidos: data.apellidos,
          telefono: data.telefono ?? '',
        });
        this.form.markAsPristine();
        this.authSession.updateIdentity(data.nombres, data.apellidos);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.resolveError(error, 'No pudimos cargar tu perfil.'));
        this.isLoading.set(false);
      },
    });
  }

  save(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: UpdateUserProfileRequest = {
      nombres: this.form.controls.nombres.value.trim(),
      apellidos: this.form.controls.apellidos.value.trim(),
      telefono: this.form.controls.telefono.value.trim(),
    };

    this.isSaving.set(true);

    this.userProfileService.updateCurrentProfile(request).subscribe({
      next: ({ data, message }) => {
        this.profile.set(data);
        this.form.reset({
          nombres: data.nombres,
          apellidos: data.apellidos,
          telefono: data.telefono ?? '',
        });
        this.form.markAsPristine();
        this.authSession.updateIdentity(data.nombres, data.apellidos);
        this.successMessage.set(message ?? 'Perfil actualizado correctamente.');
        this.isSaving.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(this.resolveError(error, 'No pudimos guardar tus cambios.'));
        this.isSaving.set(false);
      },
    });
  }

  hasError(controlName: 'nombres' | 'apellidos' | 'telefono'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  private resolveError(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté activo.';
    }

    return error.error?.message || fallback;
  }
}
