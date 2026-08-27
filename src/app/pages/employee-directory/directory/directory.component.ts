import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UI_CONFIG } from '@core/constants';
import { BranchOptions, IDropdownOption } from '@core/constants/employee-master-data';
import { IDepartmentResponse } from '@core/interfaces/community/department.interface';
import { IDesignationResponse } from '@core/interfaces/community/designation.interface';
import { IEmployeeDirectoryCardResponse, IEmployeeFilterParams } from '@core/interfaces/employee-directory/employee.interface';
import { DepartmentService } from '@core/services/community/department.service';
import { DesignationService } from '@core/services/community/designation.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { SortEvent } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DirectoryColumns } from './directory.component.constants';

/**
 * Directory browse/search page (US-1.1/1.2). Uses the standard p-table + paginator
 * pattern (see User Management / Shift List) rather than the card-grid + infinite-scroll
 * originally specified in US-1.1/1.2, per explicit product decision on 2026-07-14 to keep
 * list UX consistent across the app. Search remains live/debounced (US-1.2) rather than
 * click-to-search, unlike other p-table lists.
 */
@Component({
  selector: 'app-directory',
  standalone: false,
  templateUrl: './directory.component.html',
  styleUrl: './directory.component.scss',
})
export class DirectoryComponent implements OnInit {
  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private designationService: DesignationService,
    private cdr: ChangeDetectorRef,
  ) {}

  employees: IEmployeeDirectoryCardResponse[] = [];
  selectedEmployees: IEmployeeDirectoryCardResponse[] = [];
  loading = true;
  totalRecords = 0;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;
  UI_CONFIG = UI_CONFIG;

  sortedColumn = '';
  sortBy = '';
  sortDirection = '';

  columns = DirectoryColumns;

  searchTerm = '';
  departmentId: number | null = null;
  siteId: number | null = null;
  designationId: number | null = null;

  departmentOptions: IDepartmentResponse[] = [];
  branchOptions: IDropdownOption[] = [...BranchOptions];
  designationOptions: IDesignationResponse[] = [];

  filtersCollapsed = false;
  tableCollapsed = true;

  private searchTermChanged$ = new Subject<string>();

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  ngOnInit(): void {
    this.searchTermChanged$.pipe(debounceTime(UI_CONFIG.searchDebounceTime), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1;
      this.loadDirectory();
    });

    this.loadDirectory();

    this.departmentService.getPaged().subscribe((response) => {
      this.departmentOptions = !response.hasError && response.content ? response.content.data || [] : [];
    });
    this.designationService.getPaged().subscribe((response) => {
      this.designationOptions = !response.hasError && response.content ? response.content.data || [] : [];
    });
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchTermChanged$.next(value);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadDirectory();
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

  resetFilters(): void {
    this.searchTerm = '';
    this.departmentId = null;
    this.siteId = null;
    this.designationId = null;
    this.currentPage = 1;
    this.loadDirectory();
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadDirectory();
  }

  onSort(event: SortEvent): void {
    this.sortedColumn = event.field || '';
    this.sortBy = event.field || '';
    this.sortDirection = event.order === 1 ? 'asc' : 'desc';
    this.currentPage = 1;
    this.loadDirectory();
  }

  onSelectionChange(event: any): void {
    this.selectedEmployees = event;
    this.cdr.detectChanges();
  }

  private loadDirectory(): void {
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
    };

    this.employeeService.getDirectoryPaginated(params).subscribe({
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
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
