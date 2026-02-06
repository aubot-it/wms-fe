import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ListResponse, PagedResult, SkuDTO } from './wcs.models';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class WcsSkuApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

  getSkuList(opts?: {
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<SkuDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.page != null) params = params.set('page', String(opts.page));
    if (opts?.pageSize != null) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<SkuDTO>>(`${this.baseUrl}/Configuration/Sku/GetList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createSku(payload: SkuDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Configuration/Sku/Create`, payload);
  }

  updateSku(payload: SkuDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Configuration/Sku/Update`, payload);
  }

  deleteSku(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Configuration/Sku/Delete`, { params });
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
