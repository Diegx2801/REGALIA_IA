import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';

const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
};

type AuthMode = 'login' | 'registro';
type MessageType = 'error' | 'success';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class AuthComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authSession = inject(AuthSessionService);

  readonly mode = signal<AuthMode>(this.router.url.includes('registro') ? 'registro' : 'login');
  readonly isSubmitting = signal(false);
  readonly showLoginPassword = signal(false);
  readonly showRegisterPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly message = signal('');
  readonly messageType = signal<MessageType>('error');
  readonly sellerIntent = computed(() => this.route.snapshot.queryParamMap.get('origen') === 'proveedor');

  readonly activeTitle = computed(() =>
    this.mode() === 'login' ? 'Vuelve a regalar momentos memorables' : 'Tu próxima historia empieza aquí',
  );

  readonly activeText = computed(() =>
    this.mode() === 'login'
      ? 'Accede a tus solicitudes, reservas, favoritos y conversaciones con proveedores locales.'
      : 'Crea una cuenta personal para descubrir, solicitar y reservar regalos únicos con total confianza.',
  );

  readonly loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    remember: new FormControl(true, { nonNullable: true }),
  });

  readonly registerForm = new FormGroup(
    {
      firstName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      }),
      lastName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(150)],
      }),
      phone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(20), Validators.pattern(/^$|^[0-9+()\s-]{7,20}$/)],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      terms: new FormControl(false, {
        nonNullable: true,
        validators: [Validators.requiredTrue],
      }),
    },
    { validators: passwordsMatchValidator },
  );

  setMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.clearMessage();
    void this.router.navigate([mode === 'login' ? '/login' : '/registro'], {
      queryParamsHandling: 'merge',
    });
  }

  submitLogin(): void {
    this.clearMessage();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.loginForm.getRawValue();
    this.isSubmitting.set(true);

    this.authSession
      .login(
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
          void this.router.navigateByUrl(this.postAuthDestination(returnUrl));
        },
        error: (error) => this.showError(this.readApiMessage(error, 'No pudimos iniciar sesión. Revisa tus datos.')),
      });
  }

  submitRegister(): void {
    this.clearMessage();

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, phone, password } = this.registerForm.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.isSubmitting.set(true);

    this.authSession
      .register({
        nombres: firstName.trim(),
        apellidos: lastName.trim(),
        correo: email.trim().toLowerCase(),
        telefono: phone.trim(),
        contrasena: password,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.messageType.set('success');
          this.message.set('Tu cuenta fue creada correctamente. Estamos preparando tu experiencia.');
          setTimeout(() => void this.router.navigateByUrl(this.postAuthDestination(returnUrl)), 700);
        },
        error: (error) => this.showError(this.readApiMessage(error, 'No pudimos crear tu cuenta. Inténtalo nuevamente.')),
      });
  }

  toggleLoginPassword(): void {
    this.showLoginPassword.update((visible) => !visible);
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword.update((visible) => !visible);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((visible) => !visible);
  }

  hasLoginError(controlName: keyof typeof this.loginForm.controls): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  hasRegisterError(controlName: keyof typeof this.registerForm.controls): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  hasPasswordMismatch(): boolean {
    return this.registerForm.hasError('passwordMismatch') && this.registerForm.controls.confirmPassword.touched;
  }

  private postAuthDestination(returnUrl: string | null): string {
    if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) return returnUrl;
    if (this.sellerIntent() && this.authSession.role() === 'Cliente') {
      return '/cliente/solicitud-proveedor';
    }
    return this.authSession.homeForCurrentUser();
  }

  private clearMessage(): void {
    this.message.set('');
  }

  private showError(message: string): void {
    this.messageType.set('error');
    this.message.set(message);
  }

  private readApiMessage(error: unknown, fallback: string): string {
    const apiMessage = (error as { error?: { message?: string } })?.error?.message;
    return apiMessage || fallback;
  }
}
