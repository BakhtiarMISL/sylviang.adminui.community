import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { PanelModule } from 'primeng/panel';
import { TextareaModule } from 'primeng/textarea';
import { EmployeeDirectoryRoutingModule } from './employee-directory-routing.module';
import { DirectoryComponent } from './directory/directory.component';
import { ManageEmployeeComponent } from './manage-employee/manage-employee.component';
import { ProfileEditFormComponent } from './profile/profile-edit-form/profile-edit-form.component';
import { ProfileComponent } from './profile/profile.component';
import { UserManagementComponent } from './user-management/user-management.component';

@NgModule({
  declarations: [DirectoryComponent, ProfileComponent, ProfileEditFormComponent, ManageEmployeeComponent, UserManagementComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule,
    EmployeeDirectoryRoutingModule,
    ButtonModule,
    ConfirmDialogModule,
    InputNumberModule,
    PanelModule,
    TextareaModule,
  ],
})
export class EmployeeDirectoryModule {}
