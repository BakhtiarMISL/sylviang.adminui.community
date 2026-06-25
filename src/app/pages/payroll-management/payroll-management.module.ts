import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { PayrollManagementRoutingModule } from './payroll-management-routing.module';
import { PayrollHeadListComponent } from './payroll-head-list/payroll-head-list.component';
import { ManagePayrollHeadComponent } from './manage-payroll-head/manage-payroll-head.component';

@NgModule({
  declarations: [PayrollHeadListComponent, ManagePayrollHeadComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    PayrollManagementRoutingModule,
    RouterModule,
    TranslateModule,
    ConfirmDialogModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
    InputNumberModule,
    TextareaModule,
    TooltipModule,
  ],
})
export class PayrollManagementModule {}
