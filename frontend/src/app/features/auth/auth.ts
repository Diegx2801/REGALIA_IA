import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService, UserRole } from '../../core/services/auth/auth-session.service';

type AuthMode = 'login' | 'registro';

// Pantalla unificada para login/registro mientras la autenticacion real se conecta al backend.
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class AuthComponent {
  private readonly router = inject(Router);
  private readonly authSession = inject(AuthSessionService);

  readonly mode = signal<AuthMode>(this.router.url.includes('registro') ? 'registro' : 'login');
  readonly submitted = signal(false);

  readonly activeTitle = computed(() =>
    this.mode() === 'login' ? 'Bienvenido de nuevo a REGALIA' : 'Crea tu cuenta en REGALIA',
  );

  readonly activeText = computed(() =>
    this.mode() === 'login'
      ? 'Accede para continuar tus solicitudes, revisar reservas y guardar proveedores favoritos.'
      : 'Elige tu rol para entrar al flujo correcto: cliente, proveedor o administracion.',
  );

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    role: new FormControl<UserRole>('Cliente', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    remember: new FormControl(true, { nonNullable: true }),
  });

  readonly registerForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(7)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
    role: new FormControl<UserRole>('Cliente', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    terms: new FormControl(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  readonly roleOptions: UserRole[] = ['Cliente', 'Proveedor', 'Administrador'];

  setMode(mode: AuthMode): void {
    // Cambia entre login y registro manteniendo la URL sincronizada.
    this.mode.set(mode);
    this.submitted.set(false);
    void this.router.navigate([mode === 'login' ? '/login' : '/registro']);
  }

  submitLogin(): void {
    this.submitted.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Punto de integracion futura: aqui se consumira AuthController cuando se conecte al backend.
    const { email, role } = this.loginForm.getRawValue();
    this.authSession.login(email, role);
    this.submitted.set(true);
    void this.router.navigate([this.authSession.homeForRole(role)]);
  }

  submitRegister(): void {
    this.submitted.set(false);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Punto de integracion futura: el registro visual queda listo sin acoplarse aun a servicios HTTP.
    const { fullName, email, role } = this.registerForm.getRawValue();
    this.authSession.register(fullName, email, role);
    this.submitted.set(true);
    void this.router.navigate([this.authSession.homeForRole(role)]);
  }

  hasLoginError(controlName: keyof typeof this.loginForm.controls): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  hasRegisterError(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
