import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ListResponse,
  LocationDTO,
  LocationTypeDTO,
  PagedResult,
  TemperatureControlType,
  ZoneDTO,
  ZoneUsage
} from './wcs.models';

@Injectable({ providedIn: 'root' })
export class WcsZoneApi {
  private readonly baseUrl = '/wcs';

  constructor(private http: HttpClient) {}

  getZoneList(opts?: {
    keyword?: string;
    warehouseId?: number;
    temperatureControlType?: TemperatureControlType;
    zoneUsage?: ZoneUsage;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<ZoneDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.warehouseId != null) params = params.set('warehouseId', String(opts.warehouseId));
    if (opts?.temperatureControlType) params = params.set('temperatureControlType', opts.temperatureControlType);
    if (opts?.zoneUsage) params = params.set('zoneUsage', opts.zoneUsage);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<ZoneDTO>>(`${this.baseUrl}/Warehouse/GetZoneList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createZone(payload: ZoneDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Warehouse/CreateZone`, payload);
  }

  updateZone(payload: ZoneDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Warehouse/UpdateZone`, payload);
  }

  deleteZone(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Warehouse/DeleteZone`, { params });
  }

  getLocationTypeList(opts?: { keyword?: string; page?: number; pageSize?: number }): Observable<PagedResult<LocationTypeDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<LocationTypeDTO>>(`${this.baseUrl}/Warehouse/GetLocationTypeList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createLocationType(payload: LocationTypeDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Warehouse/CreateLocationType`, payload);
  }

  updateLocationType(payload: LocationTypeDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Warehouse/UpdateLocationType`, payload);
  }

  deleteLocationType(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Warehouse/DeleteLocationType`, { params });
  }

  getLocationList(opts?: {
    keyword?: string;
    warehouseId?: number;
    zoneId?: number;
    locationTypeId?: number;
    page?: number;
    pageSize?: number;
  }): Observable<PagedResult<LocationDTO>> {
    let params = new HttpParams();
    if (opts?.keyword) params = params.set('keyword', opts.keyword);
    if (opts?.warehouseId != null) params = params.set('warehouseId', String(opts.warehouseId));
    if (opts?.zoneId != null) params = params.set('zoneId', String(opts.zoneId));
    if (opts?.locationTypeId != null) params = params.set('locationTypeId', String(opts.locationTypeId));
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

    return this.http
      .get<ListResponse<LocationDTO>>(`${this.baseUrl}/Warehouse/GetLocationList`, { params })
      .pipe(map((res) => this.unwrapList(res)));
  }

  createLocation(payload: LocationDTO): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/Warehouse/CreateLocation`, payload);
  }

  updateLocation(payload: LocationDTO): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/Warehouse/UpdateLocation`, payload);
  }

  deleteLocation(id: number): Observable<unknown> {
    const params = new HttpParams().set('id', String(id));
    return this.http.delete(`${this.baseUrl}/Warehouse/DeleteLocation`, { params });
  }

  private unwrapList<T>(res: ListResponse<T>): PagedResult<T> {
    if (Array.isArray(res)) return { items: res, total: res.length };
    const raw = res as Record<string, unknown>;
    const rawItems =
      raw['items'] ?? raw['data'] ?? raw['Data'] ?? raw['result'] ?? raw['locationTypes'] ?? raw['value'] ?? raw['content'];
    const items = Array.isArray(rawItems) ? (rawItems as T[]) : [];
    const total = Number(raw['total'] ?? raw['totalCount'] ?? raw['totalRecords']) || items.length;
    return { items, total };
  }
}


