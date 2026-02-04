import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsAsnApi } from '../../../api/wcs-asn.api';
import { WcsWarehouseApi } from '../../../api/wcs-warehouse.api';
import { WcsOwnerApi } from '../../../api/wcs-owner.api';
import { AsnDTO, AsnStatus, AsnType, OwnerDTO, WarehouseDTO } from '../../../api/wcs.models';

@Injectable()
export class AsnStore {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly api = inject(WcsAsnApi);
    private readonly warehouseApi = inject(WcsWarehouseApi);
    private readonly ownerApi = inject(WcsOwnerApi);

    asnTypes: AsnType[] = ['PO', 'RTV', 'TRANSFER'];
    asnStatuses: AsnStatus[] = ['CREATED', 'IN_TRANSIT', 'ARRIVED', 'RECEIVING', 'COMPLETED', 'CANCELLED'];

    warehouses = signal<WarehouseDTO[]>([]);
    owners = signal<OwnerDTO[]>([]);

    allAsns = signal<AsnDTO[]>([]);
    filteredAsns = signal<AsnDTO[]>([]);
    selectedAsns = signal<string[]>([]);
    page = signal<number>(1);
    pageSize = signal<number>(20);
    isLastPage = signal<boolean>(false);
    totalItems = signal<number>(0);
    totalPages = signal<number>(1);

    drawerOpen = signal<boolean>(false);
    drawerMode = signal<'create' | 'edit'>('create');
    drawerForm: {
        ownerID: number;
        asnNo: string;
        warehouseID: number | null;
        asnType: AsnType;
        status: AsnStatus;
        carrierID: number | null;
        vehicleNo: string;
        driverName: string;
        driverPhone: string;
        routeCode: string;
        dockCode: string;
        expectedArrival: string;
        expectedDeparture: string;
        actualArrival: string;
        numOfSku: number | null;
        expireDate: string;
    } = {
            ownerID: 1,
            asnNo: '',
            warehouseID: null,
            asnType: 'PO',
            status: 'CREATED',
            carrierID: null,
            vehicleNo: '',
            driverName: '',
            driverPhone: '',
            routeCode: '',
            dockCode: '',
            expectedArrival: '',
            expectedDeparture: '',
            actualArrival: '',
            numOfSku: null,
            expireDate: ''
        };
    private editingAsn: AsnDTO | null = null;

    displayedColumns: string[] = [
        'select',
        'asnId',
        'asnNo',
        'warehouseID',
        'asnType',
        'status',
        'driverName',
        'vehicleNo',
        'numOfSku',
        'expectedArrival',
        'expireDate'
    ];

    filters: {
        keyword: string;
        warehouseID: number | null;
        ownerID: number | null;
        asnType: '' | AsnType;
        status: '' | AsnStatus;
        asnNo: string;
        driverName: string;
    } = {
            keyword: '',
            warehouseID: null,
            ownerID: null,
            asnType: '',
            status: '',
            asnNo: '',
            driverName: ''
        };

    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.reloadWarehouses();
            this.reloadOwners();
            this.reloadFromApi();
        }
    }

    applyFilters(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.page.set(1);
        this.reloadFromApi();
    }

    applyClientFilters(): void {
        let filtered = [...this.allAsns()];

        if (this.filters.asnNo) {
            filtered = filtered.filter((a) =>
                (a.asnNo || '').toLowerCase().includes(this.filters.asnNo.toLowerCase())
            );
        }
        if (this.filters.driverName) {
            filtered = filtered.filter((a) =>
                (a.driverName || '').toLowerCase().includes(this.filters.driverName.toLowerCase())
            );
        }

        this.filteredAsns.set(filtered);
    }

    clearFilters(): void {
        this.filters = {
            keyword: '',
            warehouseID: null,
            ownerID: null,
            asnType: '',
            status: '',
            asnNo: '',
            driverName: ''
        };
        if (!isPlatformBrowser(this.platformId)) return;
        this.page.set(1);
        this.reloadFromApi();
    }

    toggleSelect(id: string): void {
        const selected = this.selectedAsns();
        if (selected.includes(id)) {
            this.selectedAsns.set(selected.filter((s) => s !== id));
        } else {
            this.selectedAsns.set([...selected, id]);
        }
    }

    toggleSelectAll(event: { checked: boolean }): void {
        const checked = event.checked;
        if (checked) {
            this.selectedAsns.set(this.filteredAsns().map((a) => this.rowKey(a)));
        } else {
            this.selectedAsns.set([]);
        }
    }

    isSomeSelected(): boolean {
        const filtered = this.filteredAsns();
        const selectedCount = filtered.filter((a) => this.isSelected(this.rowKey(a))).length;
        return selectedCount > 0 && selectedCount < filtered.length;
    }

    isSelected(id: string): boolean {
        return this.selectedAsns().includes(id);
    }

    isAllSelected(): boolean {
        const filtered = this.filteredAsns();
        return filtered.length > 0 && filtered.every((a) => this.isSelected(this.rowKey(a)));
    }

    prevPage(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (this.page() === 1 || this.isLoading()) return;
        this.page.update((p) => Math.max(1, p - 1));
        this.reloadFromApi();
    }

    nextPage(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (this.isLastPage() || this.isLoading()) return;
        this.page.update((p) => p + 1);
        this.reloadFromApi();
    }

    onPageSizeChange(size: number | string): void {
        const v = Number(size);
        if (!Number.isFinite(v) || v <= 0) return;
        this.pageSize.set(v);
        this.page.set(1);
        if (!isPlatformBrowser(this.platformId)) return;
        this.reloadFromApi();
    }

    goToPage(p: number): void {
        if (!isPlatformBrowser(this.platformId)) return;
        if (p === this.page() || p < 1 || p > this.totalPages()) return;
        this.page.set(p);
        this.reloadFromApi();
    }

    onDelete(): void {
        const selected = this.selectedAsns();
        if (selected.length === 0) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa ${selected.length} ASN đã chọn?`)) return;

        const ids = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];
        if (ids.length === 0) {
            alert('Không xác định được asnId để xóa (API yêu cầu id dạng số).');
            return;
        }

        this.isLoading.set(true);
        let done = 0;
        ids.forEach((id) => {
            this.api.deleteAsn(id).subscribe({
                next: () => {
                    done++;
                    if (done === ids.length) {
                        this.isLoading.set(false);
                        this.reloadFromApi();
                        alert(`Đã gửi yêu cầu xóa ${ids.length} ASN (check backend response).`);
                    }
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
                }
            });
        });
    }

    onExportInvoice(): void {
        const selected = this.selectedAsns();
        if (selected.length !== 1) {
            alert('Vui lòng chọn đúng 1 ASN để xuất hóa đơn.');
            return;
        }

        const asn = this.allAsns().find((a) => this.rowKey(a) === selected[0]);
        if (!asn) {
            alert('Không tìm thấy ASN đã chọn.');
            return;
        }

        // TODO: Implement actual invoice export logic here
        // This could be a call to a backend API to generate PDF or Excel
        // For now, show the ASN details
        const asnInfo = `
            Thông tin ASN:
            - ASN No: ${asn.asnNo}
            - Kho: ${this.warehouseLabel(asn.warehouseID)}
            - Chủ sở hữu: ${this.ownerLabel(asn.ownerID)}
            - Loại: ${asn.asnType}
            - Trạng thái: ${asn.status}
            - Tài xế: ${asn.driverName || 'N/A'}
            - Số xe: ${asn.vehicleNo || 'N/A'}
            - Số lượng SKU: ${asn.numOfSku ?? 'N/A'}
            - Ngày đến dự kiến: ${asn.expectedArrival || 'N/A'}
        `.trim();

        alert(`Xuất hóa đơn đầu vào:\n\n${asnInfo}\n\n(Tính năng này sẽ được triển khai để xuất file PDF/Excel)`);
    }

    openCreateDrawer(): void {
        this.drawerMode.set('create');

        // Generate ASN No: (totalRecords + 1)-ddMMyyyy
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const dateStr = `${day}${month}${year}`;

        // Get current total records count
        const currentTotal = this.totalItems();
        const nextNumber = currentTotal + 1;
        const generatedAsnNo = `${nextNumber}-${dateStr}`;

        this.drawerForm = {
            ownerID: 1,
            asnNo: generatedAsnNo,
            warehouseID: this.filters.warehouseID ?? null,
            asnType: 'PO',
            status: 'CREATED',
            carrierID: null,
            vehicleNo: '',
            driverName: '',
            driverPhone: '',
            routeCode: '',
            dockCode: '',
            expectedArrival: '',
            expectedDeparture: '',
            actualArrival: '',
            numOfSku: null,
            expireDate: ''
        };
        this.editingAsn = null;
        this.drawerOpen.set(true);
    }

    openEditDrawer(): void {
        const selected = this.selectedAsns();
        if (selected.length !== 1) return;

        const asn = this.allAsns().find((a) => this.rowKey(a) === selected[0]);
        if (!asn) return;

        this.drawerMode.set('edit');
        this.editingAsn = asn;
        this.drawerForm = {
            ownerID: asn.ownerID,
            asnNo: asn.asnNo,
            warehouseID: asn.warehouseID ?? null,
            asnType: asn.asnType,
            status: asn.status,
            carrierID: asn.carrierID ?? null,
            vehicleNo: asn.vehicleNo ?? '',
            driverName: asn.driverName ?? '',
            driverPhone: asn.driverPhone ?? '',
            routeCode: asn.routeCode ?? '',
            dockCode: asn.dockCode ?? '',
            expectedArrival: asn.expectedArrival ?? '',
            expectedDeparture: asn.expectedDeparture ?? '',
            actualArrival: asn.actualArrival ?? '',
            numOfSku: asn.numOfSku ?? null,
            expireDate: asn.expireDate ?? ''
        };
        this.drawerOpen.set(true);
    }

    closeDrawer(): void {
        this.drawerOpen.set(false);
        this.editingAsn = null;
    }

    submitDrawer(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const warehouseID = this.drawerForm.warehouseID;
        const asnNo = (this.drawerForm.asnNo || '').trim();
        const expireDate = (this.drawerForm.expireDate || '').trim();

        if (warehouseID == null || !Number.isFinite(warehouseID) || !asnNo || !expireDate) {
            alert('Vui lòng nhập đầy đủ các trường bắt buộc (ASN No, Warehouse, Ngày quá hạn sản phẩm)');
            return;
        }

        const payload: AsnDTO = {
            ownerID: this.drawerForm.ownerID,
            asnNo,
            warehouseID,
            asnType: this.drawerForm.asnType,
            status: this.drawerForm.status,
            carrierID: this.drawerForm.carrierID ?? undefined,
            vehicleNo: this.drawerForm.vehicleNo?.trim() || undefined,
            driverName: this.drawerForm.driverName?.trim() || undefined,
            driverPhone: this.drawerForm.driverPhone?.trim() || undefined,
            routeCode: this.drawerForm.routeCode?.trim() || undefined,
            dockCode: this.drawerForm.dockCode?.trim() || undefined,
            expectedArrival: this.drawerForm.expectedArrival || undefined,
            expectedDeparture: this.drawerForm.expectedDeparture || undefined,
            actualArrival: this.drawerForm.actualArrival || undefined,
            numOfSku: this.drawerForm.numOfSku ?? undefined,
            expireDate: this.drawerForm.expireDate || undefined
        };

        this.isLoading.set(true);

        const req$ =
            this.drawerMode() === 'create'
                ? this.api.createAsn(payload)
                : this.api.updateAsn(
                    this.editingAsn?.asnId != null ? { ...payload, asnId: this.editingAsn.asnId } : payload
                );

        req$.subscribe({
            next: () => {
                this.isLoading.set(false);
                this.closeDrawer();
                this.reloadFromApi();
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
            }
        });
    }

    rowKey(a: AsnDTO): string {
        return a.asnId != null ? String(a.asnId) : a.asnNo;
    }

    warehouseKey(w: WarehouseDTO): string {
        return w.warehouseId != null ? String(w.warehouseId) : w.warehouseCode;
    }

    warehouseLabel(warehouseID: number): string {
        const w = this.warehouses().find((x) => x.warehouseId === warehouseID);
        return w ? `${w.warehouseCode} - ${w.warehouseName}` : String(warehouseID ?? '-');
    }

    ownerKey(o: OwnerDTO): string {
        return o.ownerId != null ? String(o.ownerId) : o.ownerCode;
    }

    ownerLabel(ownerID: number): string {
        const o = this.owners().find((x) => x.ownerId === ownerID);
        return o ? `${o.ownerCode} - ${o.ownerName}` : String(ownerID ?? '-');
    }

    fromIndex(): number {
        if (this.totalItems() === 0) return 0;
        return (this.page() - 1) * this.pageSize() + 1;
    }

    toIndex(): number {
        if (this.totalItems() === 0) return 0;
        return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredAsns().length);
    }

    pages(): number[] {
        const total = this.totalPages();
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    private reloadWarehouses(): void {
        this.warehouseApi.getWarehouseList({ page: 1, pageSize: 1000 }).subscribe({
            next: (result) => {
                this.warehouses.set(result.items ?? []);
            },
            error: () => {
                this.warehouses.set([]);
            }
        });
    }

    private reloadOwners(): void {
        this.ownerApi.getOwnerList({ page: 1, pageSize: 1000 }).subscribe({
            next: (result) => {
                this.owners.set(result.items ?? []);
            },
            error: () => {
                this.owners.set([]);
            }
        });
    }

    private reloadFromApi(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.api
            .getAsnList({
                keyword: (this.filters.keyword || '').trim(),
                warehouseID: this.filters.warehouseID ?? undefined,
                ownerID: this.filters.ownerID ?? undefined,
                asnType: this.filters.asnType || undefined,
                status: this.filters.status || undefined,
                page: this.page(),
                pageSize: this.pageSize()
            })
            .subscribe({
                next: (result) => {
                    const list = result.items ?? [];
                    const total = result.total ?? list.length;

                    this.allAsns.set(list);
                    this.applyClientFilters();
                    this.selectedAsns.set([]);
                    this.totalItems.set(total);
                    const totalPages = Math.max(1, Math.ceil(total / this.pageSize()));
                    this.totalPages.set(totalPages);
                    this.isLastPage.set(this.page() >= totalPages || list.length < this.pageSize());
                    this.isLoading.set(false);
                },
                error: (err) => {
                    this.isLoading.set(false);
                    const msg =
                        (err?.error && typeof err.error === 'string' ? err.error : '') ||
                        err?.message ||
                        `HTTP ${err?.status ?? ''} ${err?.statusText ?? ''}`.trim();
                    this.errorMessage.set(msg || 'Unknown error');
                    this.allAsns.set([]);
                    this.filteredAsns.set([]);
                    this.selectedAsns.set([]);
                    this.totalItems.set(0);
                    this.totalPages.set(1);
                    this.isLastPage.set(true);
                }
            });
    }
}
