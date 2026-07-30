import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PanelModule } from 'primeng/panel';
import { SharedModule } from '@shared/shared.module';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PagesRoutingModule } from './pages-routing.module';

@NgModule({
  imports: [CommonModule, PagesRoutingModule, TranslateModule, ReactiveFormsModule, FormsModule, RouterModule, SharedModule, PanelModule],
  declarations: [DashboardComponent, ChangePasswordComponent],
})
export class PagesModule {}
