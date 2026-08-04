import { ContactVisibilityEnum } from '@core/enums/employee.enum';

export interface IEmployeeCreateRequest {
  employeeName: string;
  email: string;
  designationId: number;
  departmentId: number;
  siteId: number;
}

export interface IEmployeeUpdateProfileRequest {
  bio: string | null;
  skills: string | null;
  interests: string | null;
  achievements: string | null;
  communityContributions: string | null;
  phoneVisibility: ContactVisibilityEnum;
  emailVisibility: ContactVisibilityEnum;
  extensionVisibility: ContactVisibilityEnum;
}

export interface IEmployeeUpdatePhotoRequest {
  storagePath: string;
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
  gradeId: number | null;
  gradeName: string | null;
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

  phone: string | null;
  email: string | null;
  extension: string | null;
  phoneVisibility: ContactVisibilityEnum;
  emailVisibility: ContactVisibilityEnum;
  extensionVisibility: ContactVisibilityEnum;

  isOwnProfile: boolean;
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
