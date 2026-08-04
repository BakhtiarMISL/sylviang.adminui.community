export interface IRecognitionResponse {
  recognitionId: number;
  senderId: number;
  recipientId: number;
  badgeId: number | null;
  badgeName: string | null;
  badgeIcon: string | null;
  badgeColor: string | null;
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
  badgeId?: number | null;
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
