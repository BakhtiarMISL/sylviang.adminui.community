import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Shell } from '@app/shell/services/shell.service';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  Shell.childRoutes([
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: 'change-password',
      component: ChangePasswordComponent,
    },
    {
      path: 'attendance',
      loadChildren: () => import('./attendance-management/attendance-management.module').then((m) => m.AttendanceManagementModule),
    },
    {
      path: 'payroll',
      loadChildren: () => import('./payroll-management/payroll-management.module').then((m) => m.PayrollManagementModule),
    },
    {
      path: 'employee-directory',
      loadChildren: () => import('./employee-directory/employee-directory.module').then((m) => m.EmployeeDirectoryModule),
    },
    {
      path: 'notifications',
      loadChildren: () => import('./notifications/notifications.module').then((m) => m.NotificationsModule),
    },
    {
      path: 'community',
      loadChildren: () => import('./community/community.module').then((m) => m.CommunityModule),
    },
  ]),
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {}
