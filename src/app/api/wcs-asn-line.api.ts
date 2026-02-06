import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedResult, AsnLineDTO } from './wcs.models';
import { APP_CONFIG } from '../config/app-config';

interface AsnLineApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: AsnLineDTO[];
    totalRecords: number;
}

interface ApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: any;
}

@Injectable({ providedIn: 'root' })
export class WcsAsnLineApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(APP_CONFIG).apiBaseUrl;

    getAsnLineList(opts?: {
        keyword?: string;
        asnId?: number;
        skuId?: number;
        page?: number;
        pageSize?: number;
    }): Observable<PagedResult<AsnLineDTO>> {
        let params = new HttpParams();
        if (opts?.keyword) params = params.set('keyword', opts.keyword);
        if (opts?.asnId != null) params = params.set('asnId', String(opts.asnId));
        if (opts?.skuId != null) params = params.set('skuId', String(opts.skuId));
        if (opts?.page != null) params = params.set('page', String(opts.page));
        if (opts?.pageSize != null) params = params.set('pageSize', String(opts.pageSize));
        console.log(params);
        return this.http
            .get<AsnLineApiResponse>(`${this.baseUrl}/Inbound/Asn_Line/GetList`, { params })
            .pipe(
                map((res) => ({
                    items: res.data ?? [],
                    total: res.totalRecords ?? 0
                }))
            );
    }

    // Special create via Scan-Handheld API
    scanHandheld(payload: AsnLineDTO): Observable<any> {
        return this.http.post<ApiResponse>(
            `${this.baseUrl}/Inbound/Asn_Line/Scan-Handheld`,
            payload
        );
    }

    updateAsnLine(payload: AsnLineDTO): Observable<any> {
        return this.http.put<ApiResponse>(
            `${this.baseUrl}/Inbound/Asn_Line/Update`,
            payload
        );
    }

    deleteAsnLine(id: number): Observable<any> {
        return this.http.delete<ApiResponse>(
            `${this.baseUrl}/Inbound/Asn_Line/Delete?id=${id}`
        );
    }
}
