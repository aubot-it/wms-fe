import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LpnDTO } from './wcs.models';

interface ApiResponse {
    isSuccess: boolean;
    message: string;
    code: number;
    errors: any;
    data: any;
}

@Injectable({ providedIn: 'root' })
export class WcsLpnApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/wcs';

    createLpn(payload: LpnDTO): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(
            `${this.baseUrl}/Inbound/Lpn/Create`,
            payload
        );
    }
}
