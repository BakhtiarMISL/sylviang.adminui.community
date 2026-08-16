import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IPurchaseCreateRequest, IPurchaseResponse } from '@core/interfaces/community/marketplace.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/purchase';

  create(request: IPurchaseCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getMine() {
    return this.httpClient.get<ApiResponse<IPurchaseResponse[]>>(`${this.API_URL}/mine`);
  }

  hasPurchased(listingId: number) {
    return this.httpClient.get<ApiResponse<boolean>>(`${this.API_URL}/has-purchased/${listingId}`);
  }
}
