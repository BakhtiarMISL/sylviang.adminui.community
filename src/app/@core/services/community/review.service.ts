import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IReviewCreateRequest,
  IReviewImageAddRequest,
  IReviewImageResponse,
  IReviewResponse,
} from '@core/interfaces/community/marketplace.interface';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/review';

  getForListing(listingId: number) {
    return this.httpClient.get<ApiResponse<IReviewResponse[]>>(`${this.API_URL}/listing/${listingId}`);
  }

  create(request: IReviewCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  getImages(reviewId: number) {
    return this.httpClient.get<ApiResponse<IReviewImageResponse[]>>(`${this.API_URL}/${reviewId}/images`);
  }

  addImage(reviewId: number, request: IReviewImageAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${reviewId}/images`, request);
  }
}
