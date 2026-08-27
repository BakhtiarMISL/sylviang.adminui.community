import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { BranchOptions, IDropdownOption } from '@core/constants/employee-master-data';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { IDesignationResponse } from '@core/interfaces/community/designation.interface';
import { IEmployeeFilterParams, IEmployeeManagementRowResponse } from '@core/interfaces/employee-directory/employee.interface';
import { BreadcrumbService } from '@core/services/breadcrumb.service';
import { DepartmentService } from '@core/services/community/department.service';
import { DesignationService } from '@core/services/community/designation.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { ToastService } from '@core/services/misc/toast.service';
import { ConfirmationService, SortEvent } from 'primeng/api';
import { GrantAccessDialogMode } from './grant-access-dialog/grant-access-dialog.component';
import { StatusFilterOptions, UserManagementColumns } from './user-management.component.constants';

/**
 * HR/Admin "User Management" (US-1.7/1.8) - every employee including inactive, filterable,
 * with View Profile / Deactivate actions. Mirrors the shift-list/payroll-head-list p-table
 * pattern used elsewhere (unlike the Directory, which is deliberately a card grid).
 */
@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
    private breadcrumbService: BreadcrumbService,
  ) {}

  employees: IEmployeeManagementRowResponse[] = [];
  selectedEmployees: IEmployeeManagementRowResponse[] = [];
  sortedColumn = '';
  totalRecords = 0;
  loading = false;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  sortBy = '';
  sortDirection = '';
  searchTerm = '';
  departmentId: number | null = null;
  siteId: number | null = null;
  designationId: number | null = null;
  isActive: boolean | null = null;

  columns = UserManagementColumns;
  statusOptions = StatusFilterOptions;

  departmentOptions: IDepartmentResponse[] = [];
  branchOptions: IDropdownOption[] = [...BranchOptions];
  designationOptions: IDesignationResponse[] = [];

  filtersCollapsed = false;
  tableCollapsed = true;

  showGrantAccessDialog = false;
  selectedEmployeeForAccess: IEmployeeManagementRowResponse | null = null;
  grantAccessDialogMode: GrantAccessDialogMode = 'grant';

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.breadcrumbService.setBreadcrumbs([
      { title: 'Employee Directory', icon: 'fa-solid fa-id-badge', href: '/employee-directory/directory' },
      { title: 'User Management', icon: 'fa-solid fa-users-gear', href: '/employee-directory/user-management' },
    ]);

    this.loadEmployees();

    this.departmentService.getPaged().subscribe((response) => {
      this.departmentOptions = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.designationService.getPaged().subscribe((response) => {
      this.designationOptions = !response.hasError && response.content ? response.content.data || [] : [];
    });
  }

  applySearch(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  onFiltersCollapsedChange(collapsed: boolean): void {
    this.filtersCollapsed = collapsed;
    if (!collapsed) {
      this.tableCollapsed = true;
    }
  }

  onTableCollapsedChange(collapsed: boolean): void {
    this.tableCollapsed = collapsed;
    if (!collapsed) {
      this.filtersCollapsed = true;
    }
  }

  resetSearch(): void {
    this.searchTerm = '';
    this.departmentId = null;
    this.siteId = null;
    this.designationId = null;
    this.isActive = null;
    this.currentPage = 1;
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;

    const params: IEmployeeFilterParams = {
      page: this.currentPage,
      pageSize: this.rows,
      ...(this.searchTerm.trim() && { searchTerm: this.searchTerm.trim() }),
      ...(this.sortBy && { sortBy: this.sortBy }),
      ...(this.sortDirection && { sortDirection: this.sortDirection as 'asc' | 'desc' }),
      ...(this.departmentId !== null && { departmentId: this.departmentId }),
      ...(this.siteId !== null && { siteId: this.siteId }),
      ...(this.designationId !== null && { designationId: this.designationId }),
      ...(this.isActive !== null && { isActive: this.isActive }),
    };

    this.employeeService.getManagementPaginated(params).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.employees = response.content.data || [];
          this.totalRecords = response.content.totalCount || 0;
        } else {
          this.employees = [];
          this.totalRecords = 0;
        }
        this.selectedEmployees = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.employees = [];
        this.totalRecords = 0;
        this.selectedEmployees = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onSelectionChange(event: any): void {
    this.selectedEmployees = event;
    this.cdr.detectChanges();
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadEmployees();
  }

  onSort(event: SortEvent): void {
    this.sortedColumn = event.field || '';
    this.sortBy = event.field || '';
    this.sortDirection = event.order === 1 ? 'asc' : 'desc';
    this.currentPage = 1;
    this.loadEmployees();
  }

  openGrantAccessDialog(employee: IEmployeeManagementRowResponse): void {
    this.selectedEmployeeForAccess = employee;
    this.grantAccessDialogMode = 'grant';
    this.showGrantAccessDialog = true;
  }

  openResetPasswordDialog(employee: IEmployeeManagementRowResponse): void {
    this.selectedEmployeeForAccess = employee;
    this.grantAccessDialogMode = 'reset';
    this.showGrantAccessDialog = true;
  }

  onGrantAccessDialogVisibilityChange(visible: boolean): void {
    this.showGrantAccessDialog = visible;
    if (!visible) {
      this.loadEmployees();
    }
  }

  deactivateEmployee(employee: IEmployeeManagementRowResponse, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to deactivate ${employee.employeeName}?`,
      header: 'Deactivate Confirmation',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.employeeService.deactivateEmployee(employee.employeeId).subscribe({
          next: (response) => {
            if (!response.hasError) {
              this.toast.success({ detail: `${employee.employeeName} deactivated.` });
              this.loadEmployees();
            }
          },
        });
      },
    });
  }
}
