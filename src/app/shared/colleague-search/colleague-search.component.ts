import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IEmployeeDirectoryCardResponse } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { Base_URL } from '@env/environment';

/**
 * Org-wide colleague search bar, embedded in the Feed page header and the Directory/Profile
 * page headers (not the global app shell - deliberately scoped to just these pages). Reuses
 * the same GET community/employee/paged + IEmployeeDirectoryCardResponse call already used by
 * mention-textarea.component.ts's @mention colleague picker - no new backend endpoint.
 */
@Component({
  selector: 'app-colleague-search',
  standalone: false,
  templateUrl: './colleague-search.component.html',
  styleUrl: './colleague-search.component.scss',
})
export class ColleagueSearchComponent {
  results: IEmployeeDirectoryCardResponse[] = [];
  query = '';

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
  ) {}

  search(event: { query: string }): void {
    this.employeeService.getDirectoryPaginated({ searchTerm: event.query, page: 1, pageSize: 8 }).subscribe({
      next: (response) => {
        this.results = !response.hasError && response.content ? response.content.data : [];
      },
      error: () => {
        this.results = [];
      },
    });
  }

  onSelect(employee: IEmployeeDirectoryCardResponse): void {
    this.query = '';
    this.results = [];
    this.router.navigate(['/community/profile', employee.employeeId]);
  }

  photoUrl(path: string | null): string {
    return path ? `${Base_URL}/${path}` : '';
  }
}
