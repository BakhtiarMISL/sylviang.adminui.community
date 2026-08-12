import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { TabViewModule } from 'primeng/tabview';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { NotificationCenterComponent } from './notification-center/notification-center.component';
import { NotificationPreferencesComponent } from './notification-preferences/notification-preferences.component';
import { NotificationsRoutingModule } from './notifications-routing.module';

@NgModule({
  declarations: [NotificationCenterComponent, NotificationPreferencesComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule,
    NotificationsRoutingModule,
    ButtonModule,
    PanelModule,
    TabViewModule,
    ToggleSwitchModule,
  ],
})
export class NotificationsModule {}
