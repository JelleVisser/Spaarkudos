import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard';
import { guestGuard } from './core/auth/guest-guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((module) => module.Login),
  },
  {
    path: 'dashboard/member/:memberId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parent/member-dashboard/member-dashboard').then(
        (module) => module.MemberDashboard,
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/parent/parent-shell/parent-shell').then((module) => module.ParentShell),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
