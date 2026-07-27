import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { hrAdminGuard } from '@core/guards/hr-admin.guard';
import { DirectoryComponent } from './directory/directory.component';
import { ManageEmployeeComponent } from './manage-employee/manage-employee.component';
import { ProfileComponent } from './profile/profile.component';
import { UserManagementComponent } from './user-management/user-management.component';

const routes: Routes = [
  {
    path: 'directory',
    component: DirectoryComponent,
  },
  {
    // Must come before 'profile/:id' - resolves to the current mock user's own profile.
    path: 'profile/me',
    component: ProfileComponent,
  },
  {
    path: 'profile/:id',
    component: ProfileComponent,
  },
  {
    path: 'manage-employee',
    component: ManageEmployeeComponent,
    canActivate: [hrAdminGuard],
  },
  {
    path: 'user-management',
    component: UserManagementComponent,
    canActivate: [hrAdminGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeeDirectoryRoutingModule {}
