import { PostVisibility } from '@core/interfaces/community/post.interface';

export interface IVisibilityOption {
  value: PostVisibility;
  label: string;
}

/** Mirrors the backend's VisibilityEnum (Domain/Enums/Enum.cs) - keep in sync. "Branch" maps to Employee.SiteId. */
export const VISIBILITY_OPTIONS: IVisibilityOption[] = [
  { value: 'Everyone', label: 'Everyone' },
  { value: 'Department', label: 'My Department' },
  { value: 'Branch', label: 'My Branch' },
];
