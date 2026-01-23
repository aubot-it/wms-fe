import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ListResponse, WarehouseDTO } from './wcs.models';

@Injectable({ providedIn: 'root' })
export class WcsWarehouseApi {
  /**
   * Using dev-proxy:
   * - browser calls: http://localhost:4200/wcs/...
   * - proxy rewrites to: http://wcs.aubot.vn:5437/...
   */
  private readonly baseUrl = '/wcs';

  constructor(private http: HttpClient) {}

  getWarehouseList(opts?: { keyword?: string; page?: number; pageSize?: number }): Observable<WarehouseDTO[]> {
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

  private unwrapList<T>(res: ListResponse<T>): T[] {
    if (Array.isArray(res)) return res;
    return res.items ?? res.data ?? res.result ?? [];
  }
}


