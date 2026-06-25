import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from '@app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { EnumNamePipe } from '@app/@core/utils/enum-utils';
import { AttendanceManagementRoutingModule } from './attendance-management-routing.module';
import { ManageShiftComponent } from './manage-shift/manage-shift.component';
import { ShiftListComponent } from './shift-list/shift-list.component';

@NgModule({
  declarations: [ShiftListComponent, ManageShiftComponent],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    SharedModule,
    AttendanceManagementRoutingModule,
    RouterModule,
    TranslateModule,
    ConfirmDialogModule,
    InputSwitchModule,
    RadioButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    CheckboxModule,
    FloatLabelModule,
    SelectModule,
    SkeletonModule,
    InputNumberModule,
    MultiSelectModule,
    TextareaModule,
    TooltipModule,
    EnumNamePipe,
  ],
})
export class AttendanceManagementModule {}
