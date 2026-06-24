import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
})
export class AdminLoginComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly showPassword = signal(false);
  readonly errorMessage = signal('');

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    remember: new FormControl(false, { nonNullable: true }),
  });

  submit(): void {
    this.errorMessage.set('');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.loginForm.getRawValue();

    this.isSubmitting.set(true);

    this.authSession
      .loginAdmin(
        {
          correo: email.trim().toLowerCase(),
          contrasena: password,
        },
        remember,
      )
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(this.safeAdminDestination(returnUrl));
        },
        error: (error) => this.errorMessage.set(this.readApiMessage(error)),
      });
  }

  togglePassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  hasError(controlName: keyof typeof this.loginForm.controls): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  private safeAdminDestination(returnUrl: string | null): string {
    if (returnUrl?.startsWith('/admin') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }

    return '/admin/resumen';
  }

  private readApiMessage(error: unknown): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    return apiMessage || 'No pudimos iniciar sesión como administrador. Revisa tus credenciales.';
  }
}