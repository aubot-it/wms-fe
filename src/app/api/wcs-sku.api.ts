import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PagedResult, SkuDTO } from './wcs.models';

interface SkuApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: SkuDTO[];
    totalRecords: number;
}

@Injectable({ providedIn: 'root' })
export class WcsSkuApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/wcs';

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
            .get<SkuApiResponse>(`${this.baseUrl}/Configuration/Sku/GetList`, { params })
            .pipe(
                map((res) => ({
                    items: res.data ?? [],
                    total: res.totalRecords ?? 0
                }))
            );
    }
}
