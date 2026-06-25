import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManageShiftComponent } from './manage-shift/manage-shift.component';
import { ShiftListComponent } from './shift-list/shift-list.component';

const routes: Routes = [
  {
    path: 'shift-list',
    component: ShiftListComponent,
  },
  {
    path: 'manage-shift',
    component: ManageShiftComponent,
  },
  {
    path: 'manage-shift/:id',
    component: ManageShiftComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AttendanceManagementRoutingModule {}
