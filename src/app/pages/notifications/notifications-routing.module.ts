import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { NotificationCenterComponent } from './notification-center/notification-center.component';
import { NotificationPreferencesComponent } from './notification-preferences/notification-preferences.component';

const routes: Routes = [
  {
    path: '',
    component: NotificationCenterComponent,
    canActivate: [authGuard],
  },
  {
    path: 'preferences',
    component: NotificationPreferencesComponent,
    canActivate: [authGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsRoutingModule {}
