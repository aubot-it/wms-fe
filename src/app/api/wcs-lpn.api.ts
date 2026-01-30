import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { LpnDTO, PagedResult, ListResponse } from './wcs.models';

interface ApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: any;
    totalRecords?: number;
}

@Injectable({ providedIn: 'root' })
export class WcsLpnApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/wcs';

    getLpnList(opts?: {
        keyword?: string;
        page?: number;
        pageSize?: number;
    }): Observable<PagedResult<LpnDTO>> {
        let params = new HttpParams();
        if (opts?.keyword) params = params.set('keyword', opts.keyword);
        if (opts?.page) params = params.set('page', String(opts.page));
        if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

        return this.http
            .get<ApiResponse>(`${this.baseUrl}/Inbound/Lpn/GetList`, { params })
            .pipe(
                map((res) => ({
                    items: res.data || [],
                    total: res.totalRecords || (res.data || []).length
                }))
            );
    }

    createLpn(payload: LpnDTO): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.baseUrl}/Inbound/Lpn/Create`,
            payload
        );
    }

    confirmPallet(lpnId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('lpnId', String(lpnId));
        return this.http.post<ApiResponse>(
            `${this.baseUrl}/Inbound/Lpn/ConfirmPallet`,
            null,
            { params }
        );
    }

    deleteLpn(lpnId: number): Observable<ApiResponse> {
        const params = new HttpParams().set('id', String(lpnId));
        return this.http.delete<ApiResponse>(
            `${this.baseUrl}/Inbound/Lpn/Delete`,
            { params }
        );
    }
}
