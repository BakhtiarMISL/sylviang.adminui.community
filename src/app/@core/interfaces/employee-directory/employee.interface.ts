import { ContactVisibilityEnum } from '@core/enums/employee.enum';

export interface IEmployeeCreateRequest {
  employeeName: string;
  email: string;
  designationId: number;
  departmentId: number;
  siteId: number;
  dateOfJoining: string;
  dateOfBirth: string | null;
}

export interface IEmployeeContactLinkRequest {
  id: number | null;
  platform: string;
  url: string;
  visibility: ContactVisibilityEnum;
}

export interface IEmployeeContactLink {
  id: number;
  platform: string;
  url: string;
  visibility: ContactVisibilityEnum;
}

export interface IEmployeeUpdateProfileRequest {
  dateOfBirth: string | null;
  bio: string | null;
  skills: string | null;
  interests: string | null;
  achievements: string | null;
  communityContributions: string | null;
  phone: string | null;
  email: string | null;
  extension: string | null;
  phoneVisibility: ContactVisibilityEnum;
  emailVisibility: ContactVisibilityEnum;
  extensionVisibility: ContactVisibilityEnum;
  contactLinks: IEmployeeContactLinkRequest[];
}

export interface IEmployeeUpdatePhotoRequest {
  storagePath: string;
}

export interface IEmployeeUpdateRequest {
  email: string;
  dateOfBirth: string | null;
  dateOfJoining: string;
}

export interface IEmployeeUpdateCoverPhotoRequest {
  storagePath: string;
}

export interface IEmployeeDirectoryCardResponse {
  employeeId: number;
  employeeCode: string | null;
  employeeName: string | null;
  photoUrl: string | null;
  designationId: number | null;
  designationName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  siteId: number | null;
  siteName: string | null;
  skills: string[];
}

export interface IEmployeeManagementRowResponse {
  employeeId: number;
  employeeCode: string | null;
  employeeName: string | null;
  email: string | null;
  designationId: number | null;
  designationName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  siteId: number | null;
  siteName: string | null;
  isActive: boolean;
  hasCredential: boolean;
}

export interface IEmployeeResponse {
  employeeId: number;
  employeeCode: string | null;
  employeeName: string | null;

  designationId: number | null;
  designationName: string | null;
  departmentId: number | null;
  departmentName: string | null;
  siteId: number | null;
  siteName: string | null;
  division: string | null;

  bio: string | null;
  skills: string[];
  interests: string[];
  achievements: string[];
  communityContributions: string[];
  badges: string[];
  recentRecognitions: string[];
  photoUrl: string | null;
  coverPhotoUrl: string | null;
  isActive: boolean;

  dateOfBirth: string | null;
  dateOfJoining: string | null;

  phone: string | null;
  email: string | null;
  extension: string | null;
  phoneVisibility: ContactVisibilityEnum;
  emailVisibility: ContactVisibilityEnum;
  extensionVisibility: ContactVisibilityEnum;
  contactLinks: IEmployeeContactLink[];

  isOwnProfile: boolean;
}

export interface IEmployeeCredentialCreateRequest {
  username: string;
  temporaryPassword: string;
  role?: string;
}

export interface IEmployeeCredentialResponse {
  employeeId: number;
  username: string;
  keycloakUserId: string;
  assignedRole: string;
}

export interface IEmployeeCredentialResetPasswordRequest {
  temporaryPassword: string;
}

export interface IEmployeeFilterParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  searchTerm?: string;
  departmentId?: number;
  siteId?: number;
  designationId?: number;
  isActive?: boolean;
}
