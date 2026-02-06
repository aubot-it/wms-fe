import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AsnDTO, AsnStatus, AsnType, PagedResult } from './wcs.models';
import { APP_CONFIG } from '../config/app-config';

interface AsnApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: AsnDTO[];
    totalRecords: number;
}

@Injectable({ providedIn: 'root' })
export class WcsAsnApi {
    private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

    constructor(private http: HttpClient) { }

    getAsnList(opts?: {
        keyword?: string;
        warehouseID?: number;
        ownerID?: number;
        asnType?: AsnType;
        status?: AsnStatus;
        page?: number;
        pageSize?: number;
    }): Observable<PagedResult<AsnDTO>> {
        let params = new HttpParams();
        if (opts?.keyword) params = params.set('keyword', opts.keyword);
        if (opts?.warehouseID != null) params = params.set('warehouseID', String(opts.warehouseID));
        if (opts?.ownerID != null) params = params.set('ownerID', String(opts.ownerID));
        if (opts?.asnType) params = params.set('asnType', opts.asnType);
        if (opts?.status) params = params.set('status', opts.status);
        if (opts?.page) params = params.set('page', String(opts.page));
        if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

        return this.http
            .get<AsnApiResponse>(`${this.baseUrl}/Inbound/Asn/GetList`, { params })
            .pipe(
                map((res) => ({
                    items: res.data ?? [],
                    total: res.totalRecords ?? 0
                }))
            );
    }

    createAsn(payload: AsnDTO): Observable<unknown> {
        return this.http.post(`${this.baseUrl}/Inbound/Asn/Create`, payload);
    }

    updateAsn(payload: AsnDTO): Observable<unknown> {
        return this.http.put(`${this.baseUrl}/Inbound/Asn/Update`, payload);
    }

    deleteAsn(id: number): Observable<unknown> {
        const params = new HttpParams().set('id', String(id));
        return this.http.delete(`${this.baseUrl}/Inbound/Asn/Delete`, { params });
    }
}
