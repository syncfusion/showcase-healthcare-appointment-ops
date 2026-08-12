export interface ProblemDetails {
  type?: string;
  title: string;
  detail?: string;
  traceId?: string;
}

export interface PagingInfo {
  total: number;
  limit: number;
  offset: number;
}

export interface ApiResult<T> {
  status: 'ok' | 'error';
  data?: T;
  error?: ProblemDetails;
  paging?: PagingInfo;
}
