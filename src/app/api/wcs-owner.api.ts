import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { OwnerDTO, PagedResult } from './wcs.models';

interface OwnerApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: OwnerDTO[];
    totalRecords: number;
}

@Injectable({ providedIn: 'root' })
export class WcsOwnerApi {
    private readonly baseUrl = '/wcs';

    constructor(private http: HttpClient) { }

    getOwnerList(opts?: {
        keyword?: string;
        page?: number;
        pageSize?: number;
    }): Observable<PagedResult<OwnerDTO>> {
        let params = new HttpParams();
        if (opts?.keyword) params = params.set('keyword', opts.keyword);
        if (opts?.page) params = params.set('page', String(opts.page));
        if (opts?.pageSize) params = params.set('pageSize', String(opts.pageSize));

        return this.http
            .get<OwnerApiResponse>(`${this.baseUrl}/Configuration/Owner/GetList`, { params })
            .pipe(
                map((res) => ({
                    items: res.data ?? [],
                    total: res.totalRecords ?? 0
                }))
            );
    }
}
