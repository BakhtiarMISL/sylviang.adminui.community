import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiResponse } from '@core/interfaces/ApiResponse';
import {
  IElectionAudienceTargetAddRequest,
  IElectionAudienceTargetResponse,
  IElectionCandidateNominateBulkRequest,
  IElectionCandidateNominateRequest,
  IElectionCandidateResponse,
  IElectionCreateRequest,
  IElectionEligibleResponse,
  IElectionFilterParams,
  IElectionResponse,
  IElectionResultsResponse,
  IElectionUpdateRequest,
  IElectionVoteCastRequest,
  IElectionVoteResponse,
} from '@core/interfaces/community/election.interface';
import { PaginatedResponse } from '@core/interfaces/PaginatedResponse';
import { BASE_URL_Community } from '@env/environment';

@Injectable({
  providedIn: 'root',
})
export class ElectionService {
  constructor(private httpClient: HttpClient) {}

  API_URL = BASE_URL_Community + '/election';

  getPaged(params: IElectionFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IElectionResponse[]>>>(`${this.API_URL}/paged`, {
      params: params as any,
    });
  }

  /** US-9.8: Open elections the current employee is eligible to vote in. */
  getEligible() {
    return this.httpClient.get<ApiResponse<IElectionEligibleResponse[]>>(`${this.API_URL}/eligible`);
  }

  getById(electionId: number) {
    return this.httpClient.get<ApiResponse<IElectionResponse>>(`${this.API_URL}/${electionId}`);
  }

  create(request: IElectionCreateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}`, request);
  }

  update(electionId: number, request: IElectionUpdateRequest) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${electionId}`, request);
  }

  delete(electionId: number) {
    return this.httpClient.delete<ApiResponse<void>>(`${this.API_URL}/${electionId}`);
  }

  publish(electionId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${electionId}/publish`, {});
  }

  close(electionId: number) {
    return this.httpClient.put<ApiResponse<void>>(`${this.API_URL}/${electionId}/close`, {});
  }

  getResults(electionId: number) {
    return this.httpClient.get<ApiResponse<IElectionResultsResponse>>(`${this.API_URL}/${electionId}/results`);
  }

  getAudience(electionId: number) {
    return this.httpClient.get<ApiResponse<IElectionAudienceTargetResponse[]>>(`${this.API_URL}/${electionId}/audience`);
  }

  addAudience(electionId: number, request: IElectionAudienceTargetAddRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${electionId}/audience`, request);
  }

  getCandidates(electionId: number) {
    return this.httpClient.get<ApiResponse<IElectionCandidateResponse[]>>(`${this.API_URL}/${electionId}/candidates`);
  }

  nominate(electionId: number, request: IElectionCandidateNominateRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${electionId}/candidates`, request);
  }

  /** Bulk-nominates every active employee matching request.scope; returns the count newly nominated. */
  nominateBulk(electionId: number, request: IElectionCandidateNominateBulkRequest) {
    return this.httpClient.post<ApiResponse<number>>(`${this.API_URL}/${electionId}/candidates/bulk`, request);
  }

  /** Casts one ballot - request.candidateIds holds every candidate selected in this submission. */
  castVote(electionId: number, request: IElectionVoteCastRequest) {
    return this.httpClient.post<ApiResponse<number[]>>(`${this.API_URL}/${electionId}/votes`, request);
  }

  getVotesPaged(electionId: number, params: IElectionFilterParams) {
    return this.httpClient.get<ApiResponse<PaginatedResponse<IElectionVoteResponse[]>>>(`${this.API_URL}/${electionId}/votes`, {
      params: params as any,
    });
  }
}
