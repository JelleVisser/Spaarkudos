import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth';

@Component({
  imports: [RouterLink],
  selector: 'app-parent-shell',
  styleUrl: './parent-shell.scss',
  templateUrl: './parent-shell.html',
})
export class ParentShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.authService.user;
  protected readonly isCreatingInitialGroup = this.authService.isCreatingInitialGroup;
  protected readonly errorMessage = this.authService.errorMessage;
  protected readonly parentName = computed(
    () => this.user()?.displayName ?? this.user()?.email ?? 'ouder',
  );

  protected async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigateByUrl('/login');
  }
}
