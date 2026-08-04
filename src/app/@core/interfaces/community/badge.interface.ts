export interface IBadgeResponse {
  badgeId: number;
  name: string;
  icon: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
}

export interface IBadgeCreateRequest {
  name: string;
  icon?: string | null;
  description?: string | null;
  color?: string | null;
}

export interface IBadgeUpdateRequest {
  name?: string | null;
  icon?: string | null;
  description?: string | null;
  color?: string | null;
  isActive?: boolean | null;
}
