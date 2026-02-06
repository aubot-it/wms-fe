import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BrandDTO, ListResponse, PagedResult } from './wcs.models';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class WcsBrandApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

  getBrandList(opts?: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<BrandDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.page != null) params = params.set('page', String(opts.page));
    if (opts?.pageSize != null) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<BrandDTO>>(`${this.baseUrl}/Configuration/Brand/GetList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createBrand(payload: BrandDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Configuration/Brand/Create`, payload);
  }

  updateBrand(payload: BrandDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Configuration/Brand/Update`, payload);
  }

  deleteBrand(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Configuration/Brand/Delete`, { params });
  }

  private unwrapList<T>(res: ListResponse<T>): PagedResult<T> {
    if (Array.isArray(res)) {
      return { items: res, total: res.length };
    }
    const items = res.items ?? res.data ?? res.result ?? [];
    const total = res.total ?? res.totalCount ?? (res as any).totalRecords ?? items.length;
    return { items, total };
  }
}

