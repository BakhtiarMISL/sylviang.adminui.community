export interface PaginatedResponse<T> {
  data: T;
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startIndex?: number;
  endIndex?: number;
}
