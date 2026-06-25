import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IPayrollHeadResponse } from '@app/@core/interfaces/payroll-management/payroll-head.interface';
import { PayrollHeadService } from '@app/@core/services/payroll/payroll-head/payroll-head.service';
import { ToastService } from '@app/@core/services/misc/toast.service';
import { PayrollHeadListColumns } from './payroll-head-list.component.constants';
import { ConfirmationService, SortEvent } from 'primeng/api';
import { UI_CONFIG } from '@app/@core/constants';

@Component({
  selector: 'app-payroll-head-list',
  standalone: false,
  templateUrl: './payroll-head-list.component.html',
  styleUrl: './payroll-head-list.component.scss',
})
export class PayrollHeadListComponent implements OnInit, AfterViewInit {
  constructor(
    private payrollHeadService: PayrollHeadService,
    private cdr: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
    private toast: ToastService,
  ) {}

  payrollHeads: IPayrollHeadResponse[] = [];
  selectedPayrollHeads: IPayrollHeadResponse[] = [];
  sortedColumn: string = '';
  isLoading = true;
  totalRecords = 0;
  loading = false;
  UI_CONFIG = UI_CONFIG;
  rows = UI_CONFIG.defaultPageSize;
  currentPage = 1;

  sortBy: string = '';
  sortDirection: string = '';
  searchTerm = '';

  get skeletonItems() {
    return Array(this.rows)
      .fill({})
      .map((_, index) => ({ id: index }));
  }

  columns = PayrollHeadListColumns;

  ngOnInit(): void {
    this.loadPayrollHeads();
    this.isLoading = false;
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  onSelectionChange(event: any) {
    this.selectedPayrollHeads = event;
    this.cdr.detectChanges();
  }

  applySearch() {
    this.currentPage = 1;
    this.loadPayrollHeads();
  }

  resetSearch() {
    this.searchTerm = '';
    this.loadPayrollHeads();
  }

  loadPayrollHeads() {
    this.loading = true;

    const params = {
      pageNumber: this.currentPage,
      pageSize: this.rows,
      ...(this.searchTerm && this.searchTerm.trim() && { searchTerm: this.searchTerm.trim() }),
      ...(this.sortBy && { sortBy: this.sortBy }),
      ...(this.sortDirection && { sortDirection: this.sortDirection }),
    };

    this.payrollHeadService.getPayrollHeadsPaginated(params).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.payrollHeads = response.content.data || [];
          this.totalRecords = response.content.totalCount || 0;
          this.selectedPayrollHeads = [];
        } else {
          this.payrollHeads = [];
          this.totalRecords = 0;
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.payrollHeads = [];
        this.totalRecords = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPageChange(event: any): void {
    this.currentPage = Math.floor(event.first / event.rows) + 1;
    this.rows = event.rows;
    this.loadPayrollHeads();
  }

  onSort(event: SortEvent) {
    this.sortedColumn = event.field || '';
    this.sortBy = event.field || '';
    this.sortDirection = event.order === 1 ? 'asc' : 'desc';
    this.currentPage = 1;
    this.loadPayrollHeads();
  }

  deletePayrollHead(head: IPayrollHeadResponse, event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete payroll head: ${head.headName}?`,
      header: 'Delete Confirmation',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptIcon: 'fa fa-check',
      rejectIcon: 'fa fa-times',
      accept: () => {
        this.payrollHeadService.deletePayrollHead(head.payrollHeadId?.toString() || '').subscribe({
          next: () => {
            this.loadPayrollHeads();
          },
          error: (error) => {
            console.error('Error deleting payroll head:', error);
          },
        });
      },
    });
  }
}
