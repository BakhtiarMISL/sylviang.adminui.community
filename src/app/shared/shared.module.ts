import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    RadioButtonModule,
    SkeletonModule,
    TableModule,
    TooltipModule,
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    CheckboxModule,
    RadioButtonModule,
    SkeletonModule,
    TableModule,
    TooltipModule,
  ],
})
export class SharedModule {}
