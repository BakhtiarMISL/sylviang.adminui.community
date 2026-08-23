import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { GroupVisibility, IGroupCreateRequest, IGroupResponse, IGroupUpdateRequest } from '@core/interfaces/community/group.interface';
import { GroupService } from '@core/services/community/group.service';
import { ToastService } from '@core/services/misc/toast.service';

/** Create (US-3.16) or edit (US-3.26) a group's name, description, and visibility. */
@Component({
  selector: 'app-group-form-dialog',
  standalone: false,
  templateUrl: './group-form-dialog.component.html',
  styleUrl: './group-form-dialog.component.scss',
})
export class GroupFormDialogComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  /** null = create a new group; a group's data = edit that group. */
  @Input() groupId: number | null = null;
  @Input() editingGroup: IGroupResponse | null = null;

  @Output() saved = new EventEmitter<void>();

  name = '';
  description = '';
  visibility: GroupVisibility = 'Public';
  submitting = false;

  constructor(
    private groupService: GroupService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetForm();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  save(): void {
    if (!this.name.trim() || this.submitting) return;

    this.submitting = true;

    if (this.groupId === null) {
      const request: IGroupCreateRequest = {
        name: this.name.trim(),
        description: this.description.trim() || null,
        visibility: this.visibility,
      };
      this.groupService.create(request).subscribe({
        next: (response) => {
          this.submitting = false;
          if (!response.hasError) {
            this.toastService.success({ detail: `"${request.name}" created.` });
            this.close();
            this.saved.emit();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not create group.' });
          }
        },
        error: () => {
          this.submitting = false;
          this.toastService.error({ detail: 'Could not create group.' });
        },
      });
    } else {
      const request: IGroupUpdateRequest = {
        name: this.name.trim(),
        description: this.description.trim() || null,
        visibility: this.visibility,
      };
      this.groupService.update(this.groupId, request).subscribe({
        next: (response) => {
          this.submitting = false;
          if (!response.hasError) {
            this.toastService.success({ detail: 'Group updated.' });
            this.close();
            this.saved.emit();
          } else {
            this.toastService.error({ detail: response.decentMessage || 'Could not update group.' });
          }
        },
        error: () => {
          this.submitting = false;
          this.toastService.error({ detail: 'Could not update group.' });
        },
      });
    }
  }

  private resetForm(): void {
    if (this.editingGroup) {
      this.name = this.editingGroup.name;
      this.description = this.editingGroup.description ?? '';
      this.visibility = this.editingGroup.visibility;
    } else {
      this.name = '';
      this.description = '';
      this.visibility = 'Public';
    }
  }
}
