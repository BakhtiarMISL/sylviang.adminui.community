import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ITodayEventResponse, TodayEventTypeEnum } from '@core/interfaces/employee-directory/employee-feed-widgets.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';

/** Feed sidebar (right column): employees whose birthday or work anniversary falls on today's date. */
@Component({
  selector: 'app-today-events-card',
  standalone: false,
  templateUrl: './today-events-card.component.html',
  styleUrl: './today-events-card.component.scss',
})
export class TodayEventsCardComponent implements OnInit {
  events: ITodayEventResponse[] = [];
  loading = true;
  readonly EventType = TodayEventTypeEnum;

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.employeeService.getTodayEvents().subscribe({
      next: (response) => {
        this.events = !response.hasError && response.content ? response.content : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.events = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
