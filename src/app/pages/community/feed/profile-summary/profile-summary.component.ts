import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '@core/services/current-user.service';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { Base_URL } from '@env/environment';

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
  standalone: false,
})
export class ProfileSummaryComponent implements OnInit {
  photoUrl: string | null = null;
  designationName: string | null = null;

  constructor(
    private readonly currentUserService: CurrentUserService,
    private readonly employeeService: EmployeeService,
  ) {}

  get employeeName(): string {
    return this.currentUserService.currentUser.employeeName;
  }

  get roleLabel(): string {
    return this.currentUserService.currentUser.role;
  }

  ngOnInit(): void {
    const employeeId = this.currentUserService.currentUser.employeeId;
    if (employeeId === null) return;

    this.employeeService.getEmployeeById(employeeId).subscribe({
      next: (response) => {
        if (!response.hasError && response.content) {
          this.photoUrl = response.content.photoUrl ? `${Base_URL}/${response.content.photoUrl}` : null;
          this.designationName = response.content.designationName;
        }
      },
      error: () => {
        // Non-critical - the card just shows the icon/role fallback if this fails.
      },
    });
  }
}
