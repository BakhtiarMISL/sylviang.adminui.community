import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { RelativeTimePipe } from '@core/pipes/relative-time.pipe';
import { AttachmentUploadComponent } from './attachment-upload/attachment-upload.component';
import { ColleagueSearchComponent } from './colleague-search/colleague-search.component';
import { MediaViewerComponent } from './media-viewer/media-viewer.component';

@NgModule({
  declarations: [AttachmentUploadComponent, ColleagueSearchComponent, MediaViewerComponent],
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
    BadgeModule,
    AutoCompleteModule,
    FileUploadModule,
    RelativeTimePipe,
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
    BadgeModule,
    AutoCompleteModule,
    FileUploadModule,
    AttachmentUploadComponent,
    ColleagueSearchComponent,
    MediaViewerComponent,
    RelativeTimePipe,
  ],
})
export class SharedModule {}
