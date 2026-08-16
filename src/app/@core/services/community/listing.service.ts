import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IListingCreateRequest,
  IListingFilterParams,
  IListingImageAddRequest,
  IListingImageResponse,
  IListingResponse,
  IListingUpdateRequest,
} from '@core/interfaces/community/marketplace.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ListingService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/listing';

  getPaged(params: IListingFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IListingResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  getById(listingId: number) {
    return this.httpClient.get<ApiResponse<IListingResponse>>(`${this.API_URL}/${listingId}`);
  }

  create(request: IListingCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(listingId: number, request: IListingUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${listingId}`, request);
  }

  delete(listingId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${listingId}`);
  }

  approve(listingId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${listingId}/approve`, {});
  }

  reject(listingId: number, rejectionReason: string) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${listingId}/reject`, { rejectionReason });
  }

  getImages(listingId: number) {
    return this.httpClient.get<ApiResponse<IListingImageResponse[]>>(`${this.API_URL}/${listingId}/images`);
  }

  addImage(listingId: number, request: IListingImageAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${listingId}/images`, request);
  }

  removeImage(listingId: number, imageId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${listingId}/images/${imageId}`);
  }
}
