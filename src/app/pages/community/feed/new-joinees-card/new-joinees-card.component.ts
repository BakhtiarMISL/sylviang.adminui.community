import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { INewJoineeResponse } from '@core/interfaces/employee-directory/employee-feed-widgets.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';

/**
 * Feed sidebar (right column): employees who joined within the last 2 days. The backend
 * live-filters this on every call, so a joinee simply stops appearing here once the window
 * passes - no client-side removal logic needed.
 */
@Component({
  selector: 'app-new-joinees-card',
  standalone: false,
  templateUrl: './new-joinees-card.component.html',
  styleUrl: './new-joinees-card.component.scss',
})
export class NewJoineesCardComponent implements OnInit {
  joinees: INewJoineeResponse[] = [];
  loading = true;

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.employeeService.getNewJoinees().subscribe({
      next: (response) => {
        this.joinees = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.joinees = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  joinedLabel(dateOfJoining: string): string {
    const today = new Date();
    const joined = new Date(dateOfJoining);
    const isSameDay = joined.getFullYear() === today.getFullYear() && joined.getMonth() === today.getMonth() && joined.getDate() === today.getDate();
    return isSameDay ? 'Joined today' : 'Joined yesterday';
  }
}
