import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth/auth-session.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css',
})
export class AccessDeniedComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly homeRoute = this.authSession.homeForCurrentUser();

  goBack(): void {
    if (typeof history !== 'undefined' && history.length > 1) {
      history.back();
      return;
    }

    void this.router.navigate([this.homeRoute]);
  }
}
