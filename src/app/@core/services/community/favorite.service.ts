import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import { IFavoriteAddRequest, IFavoriteResponse } from '@core/interfaces/community/marketplace.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/favorite';

  getAll() {
    return this.httpClient.get<ApiResponse<IFavoriteResponse[]>>(`${this.API_URL}`);
  }

  add(request: IFavoriteAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  remove(listingId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${listingId}`);
  }
}
