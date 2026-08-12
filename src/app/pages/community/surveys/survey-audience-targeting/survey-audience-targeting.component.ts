import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IBranchResponse } from '@core/interfaces/community/branch.interface';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { SurveyAudienceType } from '@core/interfaces/community/survey-audience.interface';
import { BranchService } from '@core/services/community/branch.service';
import { DepartmentService } from '@core/services/community/department.service';

/**
 * US-5.3: Entire Company / Department / Branch targeting picker. Backed by the
 * DepartmentController/BranchController endpoints (community/department, community/branch) -
 * a separate, concurrently-developed piece of work this feature reuses rather than duplicates.
 */
@Component({
  selector: 'app-survey-audience-targeting',
  standalone: false,
  templateUrl: './survey-audience-targeting.component.html',
  styleUrl: './survey-audience-targeting.component.scss',
})
export class SurveyAudienceTargetingComponent implements OnInit {
  @Input() audienceType: SurveyAudienceType | null = null;
  @Output() audienceTypeChange = new EventEmitter<SurveyAudienceType | null>();

  @Input() departmentId: number | null = null;
  @Output() departmentIdChange = new EventEmitter<number | null>();

  @Input() branchId: number | null = null;
  @Output() branchIdChange = new EventEmitter<number | null>();

  /** True once the survey already has an audience row - the backend has no update/delete for it, so it's shown read-only. */
  @Input() readonly = false;

  departments: IDepartmentResponse[] = [];
  branches: IBranchResponse[] = [];

  constructor(
    private departmentService: DepartmentService,
    private branchService: BranchService,
  ) {}

  ngOnInit(): void {
    this.departmentService.getPaged().subscribe((response) => {
      this.departments = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.branchService.getPaged().subscribe((response) => {
      this.branches = !response.hasError && response.content ? response.content.data || [] : [];
    });
  }

  onTypeChange(type: SurveyAudienceType): void {
    this.audienceType = type;
    this.audienceTypeChange.emit(type);
    if (type !== 'Department') this.onDepartmentChange(null);
    if (type !== 'Branch') this.onBranchChange(null);
  }

  onDepartmentChange(departmentId: number | null): void {
    this.departmentId = departmentId;
    this.departmentIdChange.emit(departmentId);
  }

  onBranchChange(branchId: number | null): void {
    this.branchId = branchId;
    this.branchIdChange.emit(branchId);
  }
}
