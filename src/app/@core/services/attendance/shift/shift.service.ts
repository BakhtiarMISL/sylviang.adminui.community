import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IShiftCreateRequest, IShiftResponse, IShiftUpdateRequest } from '@core/interfaces/attendance-management/shift.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Attendance } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ShiftService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Attendance + '/shift';

  getShifts() {
    return this.httpClient.get<ApiResponse<IShiftResponse[]>>(`${this.API_URL}`);
  }

  getShiftsPaginated(params: any) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IShiftResponse[]>>>(`${this.API_URL}/paged`, { params });
  }

  getShiftById(id: string) {
    return this.httpClient.get<ApiResponse<IShiftResponse>>(`${this.API_URL}/${id}/with-periods`);
  }

  addShift(shift: IShiftCreateRequest) {
    return this.httpClient.post<ApiResponse<IShiftResponse>>(`${this.API_URL}`, shift);
  }

  updateShift(id: number, shift: IShiftUpdateRequest) {
    return this.httpClient.put<ApiResponse<IShiftResponse>>(`${this.API_URL}/${id}`, shift);
  }

  deleteShift(shiftId: string) {
    return this.httpClient.delete(`${this.API_URL}/${shiftId}`);
  }
}
