export interface ApiResponse<T> {
  status: 'success' | 'fail' | 'error';
  data: T;
  message: string | null;
}
