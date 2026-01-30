import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsLpnApi } from '../../../api/wcs-lpn.api';
import { LpnDTO } from '../../../api/wcs.models';

@Injectable()
export class PalletStore {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly api = inject(WcsLpnApi);

    allPallets = signal<LpnDTO[]>([]);
    filteredPallets = signal<LpnDTO[]>([]);
    selectedPallets = signal<string[]>([]);
    page = signal<number>(1);
    pageSize = signal<number>(20);
    isLastPage = signal<boolean>(false);
    totalItems = signal<number>(0);
    totalPages = signal<number>(1);

    drawerOpen = signal<boolean>(false);
    drawerForm: {
        lpnCode: string;
        lpnLevel: string;
        qty: number | null;
        status: string;
        location: string;
        weightKg: number | null;
        volumeM3: number | null;
        closedAt: string;
    } = {
            lpnCode: '',
            lpnLevel: '',
            qty: null,
            status: 'NEW',
            location: '',
            weightKg: null,
            volumeM3: null,
            closedAt: ''
        };

    displayedColumns: string[] = [
        'select',
        'lpnId',
        'lpnCode',
        'location',
        'lpnLevel',
        'qty',
        'status',
        'weightKg',
        'closedAt'
    ];

    filters: {
        keyword: string;
        status: string;
        lpnCode: string;
        location: string;
    } = {
            keyword: '',
            status: '',
            lpnCode: '',
            location: ''
        };

    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.reloadFromApi();
        }
    }

    applyFilters(): void {
        if (!isPlatformBrowser(this.platformId)) return;
        this.page.set(1);
        this.reloadFromApi();
    }

    applyClientFilters(): void {
        let filtered = [...this.allPallets()];

        if (this.filters.lpnCode) {
            filtered = filtered.filter((p) =>
                (p.lpnCode || '').toLowerCase().includes(this.filters.lpnCode.toLowerCase())
            );
        }
        if (this.filters.location) {
            filtered = filtered.filter((p) =>
                (p.location || '').toLowerCase().includes(this.filters.location.toLowerCase())
            );
        }
        if (this.filters.status) {
            filtered = filtered.filter((p) =>
                p.status === this.filters.status
            );
        }

        this.filteredPallets.set(filtered);
    }

    clearFilters(): void {
        this.filters = {
            keyword: '',
            status: '',
            lpnCode: '',
            location: ''
        };
        if (!isPlatformBrowser(this.platformId)) return;
        this.page.set(1);
        this.reloadFromApi();
    }

    toggleSelect(id: string): void {
        const selected = this.selectedPallets();
        if (selected.includes(id)) {
            this.selectedPallets.set(selected.filter((s) => s !== id));
        } else {
            this.selectedPallets.set([...selected, id]);
        }
    }

    toggleSelectAll(event: { checked: boolean }): void {
        const checked = event.checked;
        if (checked) {
            this.selectedPallets.set(this.filteredPallets().map((p) => this.rowKey(p)));
        } else {
            this.selectedPallets.set([]);
        }
    }

    isSomeSelected(): boolean {
        const filtered = this.filteredPallets();
        const selectedCount = filtered.filter((p) => this.isSelected(this.rowKey(p))).length;
        return selectedCount > 0 && selectedCount < filtered.length;
    }

    isSelected(id: string): boolean {
        return this.selectedPallets().includes(id);
    }

    isAllSelected(): boolean {
        const filtered = this.filteredPallets();
        return filtered.length > 0 && filtered.every((p) => this.isSelected(this.rowKey(p)));
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
        const selected = this.selectedPallets();
        if (selected.length === 0) return;

        if (!confirm(`Bạn có chắc chắn muốn xóa ${selected.length} pallet đã chọn?`)) return;

        const ids = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];
        if (ids.length === 0) {
            alert('Không xác định được lpnId để xóa.');
            return;
        }

        this.isLoading.set(true);
        let done = 0;
        ids.forEach((id) => {
            this.api.deleteLpn(id).subscribe({
                next: () => {
                    done++;
                    if (done === ids.length) {
                        this.isLoading.set(false);
                        this.reloadFromApi();
                        alert(`Đã xóa ${ids.length} pallet.`);
                    }
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
                }
            });
        });
    }

    onConfirmPallet(): void {
        const selected = this.selectedPallets();
        if (selected.length !== 1) {
            alert('Vui lòng chọn đúng 1 pallet để xác nhận.');
            return;
        }

        const id = Number(selected[0]);
        if (!Number.isFinite(id)) {
            alert('Không xác định được lpnId để xác nhận.');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn xác nhận pallet này?')) return;

        this.isLoading.set(true);
        this.api.confirmPallet(id).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.reloadFromApi();
                alert('Đã xác nhận pallet thành công.');
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
                alert('Xác nhận pallet thất bại: ' + (err?.message || 'Lỗi không xác định'));
            }
        });
    }

    openCreateDrawer(): void {
        this.drawerForm = {
            lpnCode: '',
            lpnLevel: '',
            qty: null,
            status: 'NEW',
            location: '',
            weightKg: null,
            volumeM3: null,
            closedAt: ''
        };
        this.drawerOpen.set(true);
    }

    closeDrawer(): void {
        this.drawerOpen.set(false);
    }

    submitDrawer(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const lpnCode = (this.drawerForm.lpnCode || '').trim();
        const lpnLevel = (this.drawerForm.lpnLevel || '').trim();
        const qty = this.drawerForm.qty;

        if (!lpnCode || !lpnLevel || qty == null || qty <= 0) {
            alert('Vui lòng nhập đầy đủ: LPN Code, LPN Level, Qty (> 0)');
            return;
        }

        const payload: LpnDTO = {
            lpnCode,
            lpnLevel,
            qty,
            status: this.drawerForm.status || 'NEW',
            location: this.drawerForm.location?.trim() || undefined,
            weightKg: this.drawerForm.weightKg ?? undefined,
            volumeM3: this.drawerForm.volumeM3 ?? undefined,
            closedAt: this.drawerForm.closedAt || undefined
        };

        this.isLoading.set(true);

        this.api.createLpn(payload).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.closeDrawer();
                this.reloadFromApi();
                alert('Tạo pallet thành công.');
            },
            error: (err) => {
                this.isLoading.set(false);
                this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
            }
        });
    }

    rowKey(p: LpnDTO): string {
        return p.lpnId != null ? String(p.lpnId) : p.lpnCode;
    }

    fromIndex(): number {
        if (this.totalItems() === 0) return 0;
        return (this.page() - 1) * this.pageSize() + 1;
    }

    toIndex(): number {
        if (this.totalItems() === 0) return 0;
        return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredPallets().length);
    }

    pages(): number[] {
        const total = this.totalPages();
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    private reloadFromApi(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        this.api
            .getLpnList({
                keyword: (this.filters.keyword || '').trim(),
                page: this.page(),
                pageSize: this.pageSize()
            })
            .subscribe({
                next: (result) => {
                    const list = result.items ?? [];
                    const total = result.total ?? list.length;

                    this.allPallets.set(list);
                    this.applyClientFilters();
                    this.selectedPallets.set([]);
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
                    this.allPallets.set([]);
                    this.filteredPallets.set([]);
                    this.selectedPallets.set([]);
                    this.totalItems.set(0);
                    this.totalPages.set(1);
                    this.isLastPage.set(true);
                }
            });
    }
}
