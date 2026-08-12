import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResult } from '../models/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  private readonly demoSession =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  private readonly defaultHeaders = new HttpHeaders({
    Accept: 'application/json',
    'X-Demo-Session': this.demoSession,
  });

  constructor(private readonly http: HttpClient) {}

  get base(): string {
    return this.baseUrl;
  }

  getJson<T>(path: string, params?: Record<string, string>): Observable<ApiResult<T>> {
    return this.http.get<ApiResult<T>>(`${this.baseUrl}${path}`, {
      headers: this.defaultHeaders,
      params: this.toParams(params),
      withCredentials: true,
    });
  }

  postJson<T, B = unknown>(path: string, body?: B): Observable<ApiResult<T>> {
    return this.http.post<ApiResult<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.defaultHeaders.set('Content-Type', 'application/json'),
      withCredentials: true,
    });
  }

  putJson<T, B = unknown>(path: string, body: B): Observable<ApiResult<T>> {
    return this.http.put<ApiResult<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.defaultHeaders.set('Content-Type', 'application/json'),
      withCredentials: true,
    });
  }

  patchJson<T, B = unknown>(path: string, body: B): Observable<ApiResult<T>> {
    return this.http.patch<ApiResult<T>>(`${this.baseUrl}${path}`, body, {
      headers: this.defaultHeaders.set('Content-Type', 'application/json'),
      withCredentials: true,
    });
  }

  deleteJson<T>(path: string): Observable<ApiResult<T>> {
    return this.http.delete<ApiResult<T>>(`${this.baseUrl}${path}`, {
      headers: this.defaultHeaders,
      withCredentials: true,
    });
  }

  private toParams(params?: Record<string, string>): HttpParams | undefined {
    if (!params) return undefined;
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, value);
    }
    return httpParams;
  }
}

export function okOrThrow<T>(result: ApiResult<T>): T {
  if (result.status === 'error' || result.data === undefined) {
    throw new Error(result.error?.detail ?? result.error?.title ?? 'Request failed');
  }
  return result.data;
}
