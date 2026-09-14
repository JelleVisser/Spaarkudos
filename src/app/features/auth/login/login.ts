import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';

@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly errorMessage = this.authService.errorMessage;
  protected readonly isSigningIn = this.authService.isSigningIn;
  protected readonly isLoading = computed(() => this.isSigningIn());

  protected async signIn(): Promise<void> {
    await this.authService.signIn();

    if (this.authService.user()) {
      await this.router.navigateByUrl('/dashboard');
    }
  }
}
