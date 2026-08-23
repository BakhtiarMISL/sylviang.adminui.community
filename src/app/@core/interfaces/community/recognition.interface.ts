import { IBadgeResponse } from '@core/interfaces/community/badge.interface';

export interface IRecognitionResponse {
  recognitionId: number;
  senderId: number;
  recipientId: number;
  badges: IBadgeResponse[];
  recognitionType: string;
  coreValue: string | null;
  awardTitle: string | null;
  message: string | null;
  isPublic: boolean;
  isHrIssued: boolean;
  createdAt: string | null;
}

export interface IRecognitionCreateRequest {
  recipientId: number;
  badgeIds?: number[];
  recognitionType: string;
  coreValue?: string | null;
  awardTitle?: string | null;
  message?: string | null;
  isPublic?: boolean;
  isHrIssued?: boolean;
}

export interface IRecognitionFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  senderId?: number;
  recipientId?: number;
}
