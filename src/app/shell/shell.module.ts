import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BadgeModule } from 'primeng/badge';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

import { ShellComponent } from './shell.component';
import { HeaderComponent } from '@app/shell/components/header/header.component';
import { NotificationBellComponent } from '@app/shell/components/notification-bell/notification-bell.component';
import { SidebarComponent } from '@app/shell/components/sidebar/sidebar.component';
import { SidebarMenuItemComponent } from '@app/shell/components/sidebar/sidebar-menu-item/sidebar-menu-item.component';
import { ThemeToggleComponent } from '@app/shell/components/theme-toggle/theme-toggle.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule,
    FormsModule,
    SelectModule,
    TooltipModule,
    BadgeModule,
    ThemeToggleComponent,
  ],
  declarations: [ShellComponent, HeaderComponent, NotificationBellComponent, SidebarComponent, SidebarMenuItemComponent],
})
export class ShellModule {}
