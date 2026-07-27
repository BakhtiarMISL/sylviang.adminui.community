import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/pages.module').then((m) => m.PagesModule),
  },
  { path: '**', redirectTo: '/dashboard', pathMatch: 'full' },
];
