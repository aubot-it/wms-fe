import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ListResponse, PagedResult, WarehouseDTO } from './wcs.models';
import { APP_CONFIG } from '../config/app-config';

@Injectable({ providedIn: 'root' })
export class WcsWarehouseApi {
  /**
   * Using dev-proxy:
   * - browser calls: http://localhost:4200/wcs/...
   * - proxy rewrites to your backend API
   */
  private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

  constructor(private http: HttpClient) {}

  getWarehouseList(opts?: { keyword?: string; page?: number; pageSize?: number }): Observable<PagedResult<WarehouseDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<WarehouseDTO>>(`${this.baseUrl}/Warehouse/GetWarehouseList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createWarehouse(payload: WarehouseDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Warehouse/CreateWarehouse`, payload);
  }

  updateWarehouse(payload: WarehouseDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Warehouse/UpdateWarehouse`, payload);
  }

  deleteWarehouse(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Warehouse/DeleteWarehouse`, { params });
  }

  private unwrapList<T>(res: ListResponse<T>): PagedResult<T> {
    if (Array.isArray(res)) {
      return { items: res, total: res.length };
    }
    const items = res.items ?? res.data ?? res.result ?? [];
    const total = res.total ?? res.totalCount ?? items.length;
    return { items, total };
  }
}


