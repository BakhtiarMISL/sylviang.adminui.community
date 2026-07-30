import { Injectable } from '@angular/core';
import { IEmployeeResponse } from '@core/interfaces/employee-directory/employee.interface';
import { EmployeeService } from '@core/services/employee-directory/employee/employee.service';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

/**
 * Small request-dedup/cache wrapper around EmployeeService.getEmployeeById, used by the
 * feed to resolve post/comment author display names without a dedicated backend
 * enrichment endpoint - one cached lookup per employeeId, shared across whichever
 * post/comment cards reference the same author.
 */
@Injectable({
  providedIn: 'root',
})
export class EmployeeLookupService {
  private cache = new Map<number, Observable<IEmployeeResponse | null>>();

  constructor(private employeeService: EmployeeService) {}

  getById(employeeId: number): Observable<IEmployeeResponse | null> {
    const cached = this.cache.get(employeeId);
    if (cached) return cached;

    const request$ = this.employeeService.getEmployeeById(employeeId).pipe(
      map((response) => (!response.hasError && response.content ? response.content : null)),
      catchError(() => of(null)),
      shareReplay(1),
    );

    this.cache.set(employeeId, request$);
    return request$;
  }
}
