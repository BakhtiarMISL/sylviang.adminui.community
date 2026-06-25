export interface ApiResponse<T> {
  hasError: boolean;
  decentMessage: string;
  content: T;
}
