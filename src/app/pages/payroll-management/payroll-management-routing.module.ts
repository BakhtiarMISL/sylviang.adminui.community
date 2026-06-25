import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PayrollHeadListComponent } from './payroll-head-list/payroll-head-list.component';
import { ManagePayrollHeadComponent } from './manage-payroll-head/manage-payroll-head.component';

const routes: Routes = [
  {
    path: 'payroll-head-list',
    component: PayrollHeadListComponent,
  },
  {
    path: 'manage-payroll-head',
    component: ManagePayrollHeadComponent,
  },
  {
    path: 'manage-payroll-head/:id',
    component: ManagePayrollHeadComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PayrollManagementRoutingModule {}
