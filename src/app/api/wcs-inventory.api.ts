import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InventoryDTO, InventoryHistoryDTO, ListResponse, PagedResult, StatusInventory } from './wcs.models';

@Injectable({ providedIn: 'root' })
export class WcsInventoryApi {
  private readonly baseUrl = '/wcs';

  constructor(private http: HttpClient) {}

  getList(opts?: {
    keyword?: string;
    ownerId?: number;
    skuCode?: string;
    fromDate?: string;
    toDate?: string;
    status?: StatusInventory | '';
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<InventoryDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.ownerId != null) params = params.set('ownerId', String(opts.ownerId));
    if (opts?.skuCode) params = params.set('skuCode', opts.skuCode);
    if (opts?.fromDate) params = params.set('fromDate', opts.fromDate);
    if (opts?.toDate) params = params.set('toDate', opts.toDate);
    if (opts?.status) params = params.set('status', opts.status);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<InventoryDTO>>(`${this.baseUrl}/Inventory/GetList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  create(payload: InventoryDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Inventory/Create`, payload);
  }

  update(payload: InventoryDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Inventory/Update`, payload);
  }

  delete(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Inventory/Delete`, { params });
  }

  adjust(inventoryId: number, adjustQty: number, reason?: string): Observable<unknown> {
    let params = new HttpParams()
      .set('inventoryId', String(inventoryId))
      .set('adjustQty', String(adjustQty));
    if (reason != null && reason !== '') params = params.set('reason', reason);
    return this.http.post(`${this.baseUrl}/Inventory/Adjust`, null, { params });
  }

  reserve(inventoryId: number, reserveQty: number): Observable<unknown> {
    const params = new HttpParams()
      .set('inventoryId', String(inventoryId))
      .set('reserveQty', String(reserveQty));
    return this.http.post(`${this.baseUrl}/Inventory/Reserve`, null, { params });
  }

  hold(inventoryId: number, holdQty: number): Observable<unknown> {
    const params = new HttpParams()
      .set('inventoryId', String(inventoryId))
      .set('holdQty', String(holdQty));
    return this.http.post(`${this.baseUrl}/Inventory/Hold`, null, { params });
  }

  release(inventoryId: number, releaseQty: number): Observable<unknown> {
    const params = new HttpParams()
      .set('inventoryId', String(inventoryId))
      .set('releaseQty', String(releaseQty));
    return this.http.post(`${this.baseUrl}/Inventory/Release`, null, { params });
  }

  getHistory(opts?: {
    fromDate?: string;
    toDate?: string;
    inventoryId?: number;
    skuCode?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<InventoryHistoryDTO>> {
    let params = new HttpParams();
    if (opts?.fromDate) params = params.set('fromDate', opts.fromDate);
    if (opts?.toDate) params = params.set('toDate', opts.toDate);
    if (opts?.inventoryId != null) params = params.set('inventoryId', String(opts.inventoryId));
    if (opts?.skuCode) params = params.set('skuCode', opts.skuCode);
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<InventoryHistoryDTO>>(`${this.baseUrl}/Inventory/GetHistory`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  private unwrapList<T>(res: ListResponse<T>): PagedResult<T> {
    if (Array.isArray(res)) return { items: res, total: res.length };
    const raw = res as Record<string, unknown>;
    const rawItems =
      raw['items'] ?? raw['data'] ?? raw['Data'] ?? raw['result'] ?? raw['value'] ?? raw['content'] ?? [];
    const items = Array.isArray(rawItems) ? (rawItems as T[]) : [];
    const total = Number(raw['total'] ?? raw['totalCount'] ?? raw['totalRecords']) || items.length;
    return { items, total };
  }
}
