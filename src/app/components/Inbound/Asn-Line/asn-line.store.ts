import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsAsnLineApi } from '../../../api/wcs-asn-line.api';
import { WcsAsnApi } from '../../../api/wcs-asn.api';
import { WcsSkuApi } from '../../../api/wcs-sku.api';
import { WcsLpnApi } from '../../../api/wcs-lpn.api';
import { AsnLineDTO, AsnDTO, SkuDTO, LpnDTO } from '../../../api/wcs.models';

@Injectable()
export class AsnLineStore {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly api = inject(WcsAsnLineApi);
    private readonly asnApi = inject(WcsAsnApi);
    private readonly skuApi = inject(WcsSkuApi);
    private readonly lpnApi = inject(WcsLpnApi);

    asns = signal<AsnDTO[]>([]);
    skus = signal<SkuDTO[]>([]);

    allAsnLines = signal<AsnLineDTO[]>([]);
    filteredAsnLines = signal<AsnLineDTO[]>([]);
    selectedAsnLines = signal<string[]>([]);
    page = signal<number>(1);
    pageSize = signal<number>(20);
    isLastPage = signal<boolean>(false);
    totalItems = signal<number>(0);
    totalPages = signal<number>(1);

    drawerOpen = signal<boolean>(false);
    drawerMode = signal<'create' | 'edit'>('create');
    drawerForm: {
        asnId: number | null;
        skuId: number | null;
        expectedQty: number | null;
    } = {
            asnId: null,
            skuId: null,
            expectedQty: null
        };
    private editingAsnLine: AsnLineDTO | null = null;

    displayedColumns: string[] = [
        'select',
        'asnLineId',
        'asnId',
        'skuId',
        'expectedQty'
    ];

    filters: {
        keyword: string;
        asnId: number | null;
        skuId: number | null;
    } = {
            keyword: '',
            asnId: null,
            skuId: null
        };

    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    // LPN Drawer state
    lpnDrawerOpen = signal<boolean>(false);
    lpnDrawerForm: {
        lpnCode: string;
        lpnLevel: string;
        qty: number | null;
        status: string;
        weightKg: number | null;
        volumeM3: number | null;
        closedAt: string;
    } = {
            lpnCode: '',
            lpnLevel: '',
            qty: null,
            status: 'PENDING',
            weightKg: null,
            volumeM3: null,
            closedAt: ''
        };

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.reloadAsns();
            this.reloadSkus();
            this.reloadFromApi();
        }
    }

    applyFilters(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.page.set(1);
        this.reloadFromApi();
    }

    clearFilters(): void {
        this.filters = {
            keyword: '',
            asnId: null,
            skuId: null
        };
        if (!isPlatformBrowser(this.platformId)) return;
        this.page.set(1);
        this.reloadFromApi();
    }

    toggleSelect(id: string): void {
        const selected = this.selectedAsnLines();
        if (selected.includes(id)) {
            this.selectedAsnLines.set(selected.filter((s) => s !== id));
        } else {
            this.selectedAsnLines.set([...selected, id]);
        }
    }

    toggleSelectAll(event: { checked: boolean }): void {
        const checked = event.checked;
        if (checked) {
            this.selectedAsnLines.set(this.filteredAsnLines().map((line) => this.rowKey(line)));
        } else {
            this.selectedAsnLines.set([]);
        }
    }

    isSomeSelected(): boolean {
        const filtered = this.filteredAsnLines();
        const selectedCount = filtered.filter((line) => this.isSelected(this.rowKey(line))).length;
        return selectedCount > 0 && selectedCount < filtered.length;
    }

    isSelected(id: string): boolean {
        return this.selectedAsnLines().includes(id);
    }

    isAllSelected(): boolean {
        const filtered = this.filteredAsnLines();
        return filtered.length > 0 && filtered.every((line) => this.isSelected(this.rowKey(line)));
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
        const selected = this.selectedAsnLines();
        if (selected.length === 0) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa ${selected.length} ASN Line đã chọn?`)) return;

        const ids = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];
        if (ids.length === 0) {
            alert('Không xác định được asnLineId để xóa.');
            return;
        }

        this.isLoading.set(true);
        let done = 0;
        ids.forEach((id) => {
            this.api.deleteAsnLine(id).subscribe({
                next: () => {
                    done++;
                    if (done === ids.length) {
                        this.isLoading.set(false);
                        this.reloadFromApi();
                        alert(`Đã xóa ${ids.length} ASN Line.`);
                    }
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
                }
            });
        });
    }

    openCreateDrawer(): void {
        this.drawerMode.set('create');
        this.drawerForm = {
            asnId: this.filters.asnId ?? null,
            skuId: null,
            expectedQty: null
        };
        this.editingAsnLine = null;
        this.drawerOpen.set(true);
    }

    openEditDrawer(): void {
        const selected = this.selectedAsnLines();
        if (selected.length !== 1) return;

        const asnLine = this.allAsnLines().find((line) => this.rowKey(line) === selected[0]);
        if (!asnLine) return;

        this.drawerMode.set('edit');
        this.editingAsnLine = asnLine;
        this.drawerForm = {
            asnId: asnLine.asnId,
            skuId: asnLine.skuId,
            expectedQty: asnLine.expectedQty
        };
        this.drawerOpen.set(true);
    }

    closeDrawer(): void {
        this.drawerOpen.set(false);
        this.editingAsnLine = null;
    }

    submitDrawer(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const asnId = this.drawerForm.asnId;
        const skuId = this.drawerForm.skuId;
        const expectedQty = this.drawerForm.expectedQty;

        if (asnId == null || skuId == null || expectedQty == null || expectedQty <= 0) {
            alert('Vui lòng nhập đầy đủ các trường: ASN, SKU, Expected Qty (> 0)');
            return;
        }

        const payload: AsnLineDTO = {
            asnId,
            skuId,
            expectedQty
        };

        this.isLoading.set(true);

        const req$ =
            this.drawerMode() === 'create'
                ? this.api.scanHandheld(payload) // Use Scan-Handheld for create
                : this.api.updateAsnLine(
                    this.editingAsnLine?.asnLineId != null
                        ? { ...payload, asnLineId: this.editingAsnLine.asnLineId }
                        : payload
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

    rowKey(line: AsnLineDTO): string {
        return line.asnLineId != null ? String(line.asnLineId) : `${line.asnId}-${line.skuId}`;
    }

    asnKey(asn: AsnDTO): string {
        return asn.asnId != null ? String(asn.asnId) : asn.asnNo;
    }

    asnLabel(asnId: number): string {
        const asn = this.asns().find((a) => a.asnId === asnId);
        return asn ? `${asn.asnNo} (ID: ${asn.asnId})` : String(asnId ?? '-');
    }

    skuKey(sku: SkuDTO): string {
        return sku.skuID != null ? String(sku.skuID) : sku.skuCode;
    }

    skuLabel(skuId: number): string {
        const sku = this.skus().find((s) => s.skuID === skuId);
        return sku ? `${sku.skuCode} - ${sku.skuName}` : String(skuId ?? '-');
    }

    fromIndex(): number {
        if (this.totalItems() === 0) return 0;
        return (this.page() - 1) * this.pageSize() + 1;
    }

    toIndex(): number {
        if (this.totalItems() === 0) return 0;
        return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredAsnLines().length);
    }

    pages(): number[] {
        const total = this.totalPages();
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    private reloadAsns(): void {
        this.asnApi.getAsnList({ page: 1, pageSize: 1000 }).subscribe({
            next: (result) => {
                // Only show ASNs with numOfSku != 0
                const filteredAsns = (result.items ?? []).filter(asn => asn.numOfSku != null && asn.numOfSku !== 0);
                this.asns.set(filteredAsns);
            },
            error: () => {
                this.asns.set([]);
            }
        });
    }

    private reloadSkus(): void {
        this.skuApi.getSkuList({ page: 1, pageSize: 1000 }).subscribe({
            next: (result) => {
                this.skus.set(result.items ?? []);
            },
            error: () => {
                this.skus.set([]);
            }
        });
    }

    private reloadFromApi(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.api
            .getAsnLineList({
                keyword: (this.filters.keyword || '').trim(),
                asnId: this.filters.asnId ?? undefined,
                skuId: this.filters.skuId ?? undefined,
                page: this.page(),
                pageSize: this.pageSize()
            })
            .subscribe({
                next: (result) => {
                    const list = result.items ?? [];
                    const total = result.total ?? list.length;

                    this.allAsnLines.set(list);
                    this.filteredAsnLines.set(list);
                    this.selectedAsnLines.set([]);
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
                    this.allAsnLines.set([]);
                    this.filteredAsnLines.set([]);
                    this.selectedAsnLines.set([]);
                    this.totalItems.set(0);
                    this.totalPages.set(1);
                    this.isLastPage.set(true);
                }
            });
    }

    // LPN Methods
    openLpnDrawer(): void {
        const selected = this.selectedAsnLines();
        if (selected.length === 0) {
            alert('Vui lòng chọn ít nhất 1 ASN Line để tạo pallet.');
            return;
        }

        this.lpnDrawerForm = {
            lpnCode: '',
            lpnLevel: '',
            qty: null,
            status: 'PENDING',
            weightKg: null,
            volumeM3: null,
            closedAt: ''
        };
        this.lpnDrawerOpen.set(true);
    }

    closeLpnDrawer(): void {
        this.lpnDrawerOpen.set(false);
    }

    submitLpnDrawer(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const selected = this.selectedAsnLines();
        const asnLineIds = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];

        if (asnLineIds.length === 0) {
            alert('Không xác định được asnLineId để tạo pallet.');
            return;
        }

        const lpnCode = (this.lpnDrawerForm.lpnCode || '').trim();
        const lpnLevel = (this.lpnDrawerForm.lpnLevel || '').trim();
        const qty = this.lpnDrawerForm.qty;
        const status = (this.lpnDrawerForm.status || '').trim();

        if (!lpnCode || !lpnLevel || qty == null || qty <= 0 || !status) {
            alert('Vui lòng nhập đầy đủ: LPN Code, LPN Level, Qty (> 0), Status');
            return;
        }

        const payload: LpnDTO = {
            lpnCode,
            lpnLevel,
            qty,
            status,
            weightKg: this.lpnDrawerForm.weightKg ?? undefined,
            volumeM3: this.lpnDrawerForm.volumeM3 ?? undefined,
            closedAt: this.lpnDrawerForm.closedAt || undefined,
            asnLineIds
        };

        this.isLoading.set(true);

        this.lpnApi.createLpn(payload).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.closeLpnDrawer();
                this.selectedAsnLines.set([]);
                alert(`Đã tạo pallet thành công cho ${asnLineIds.length} ASN Line.`);
                this.reloadFromApi();
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
            }
        });
    }
}
