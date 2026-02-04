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
                next: (response) => {
                    if (!response.isSuccess) {
                        alert(response.message);
                        this.isLoading.set(false);
                        return;
                    }
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

    isSelectedPalletConfirmed(): boolean {
        const selected = this.selectedPallets();
        if (selected.length !== 1) return false;

        const pallet = this.allPallets().find((p) => this.rowKey(p) === selected[0]);
        return pallet?.status === 'CONFIRMED';
    }

    printPallet(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const selected = this.selectedPallets();
        if (selected.length !== 1) {
            alert('Vui lòng chọn đúng 1 pallet để in.');
            return;
        }

        const pallet = this.allPallets().find((p) => this.rowKey(p) === selected[0]);
        if (!pallet) {
            alert('Không tìm thấy thông tin pallet.');
            return;
        }

        if (pallet.status !== 'CONFIRMED') {
            alert('Chỉ có thể in phiếu cho pallet đã xác nhận (CONFIRMED).');
            return;
        }

        // Generate barcode number from lpnCode (simplified version)
        const barcodeNumber = pallet.lpnCode || pallet.lpnId?.toString() || '';

        // Generate current date and time
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN');

        // Generate a simple barcode using Code 128 format (represented as text)
        const generateBarcodeText = (code: string) => {
            // Simple representation - in production you'd use a proper barcode library
            return `||||| ${code} |||||`;
        };

        // Create print content - Pallet label with two sections (top and bottom)
        let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Pallet Label - ${pallet.lpnCode}</title>
            <style>
                @page {
                    size: A4;
                    margin: 10mm;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 10pt;
                    line-height: 1.3;
                    margin: 0;
                    padding: 0;
                }
                .label-container {
                    width: 100%;
                    page-break-inside: avoid;
                }
                .label-section {
                    border: 2px solid #000;
                    margin-bottom: 20px;
                    padding: 15px;
                    box-sizing: border-box;
                }
                .label-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 10px;
                }
                .label-title {
                    font-size: 14pt;
                    font-weight: bold;
                }
                .warehouse-info {
                    text-align: right;
                    font-size: 9pt;
                }
                .main-content {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .sku-info {
                    border: 1px solid #000;
                    padding: 10px;
                }
                .sku-code {
                    font-size: 18pt;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 5px;
                }
                .sku-description {
                    font-size: 11pt;
                    text-align: center;
                    min-height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #ccc;
                    padding: 5px;
                    margin-top: 5px;
                }
                .quantity-box {
                    border: 1px solid #000;
                    padding: 10px;
                    text-align: center;
                }
                .quantity-label {
                    font-size: 9pt;
                    margin-bottom: 5px;
                }
                .quantity-value {
                    font-size: 24pt;
                    font-weight: bold;
                }
                .barcode-section {
                    text-align: center;
                    margin: 15px 0;
                }
                .barcode {
                    font-family: 'Courier New', monospace;
                    font-size: 20pt;
                    letter-spacing: 2px;
                    margin: 10px 0;
                    border: 1px solid #000;
                    padding: 10px;
                    background: #fff;
                }
                .pallet-number {
                    font-size: 32pt;
                    font-weight: bold;
                    text-align: center;
                    margin: 15px 0;
                }
                .stage-label {
                    font-size: 28pt;
                    font-weight: bold;
                    text-align: center;
                    border: 2px solid #000;
                    padding: 10px;
                    margin: 15px 0;
                }
                .detail-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .detail-table th,
                .detail-table td {
                    border: 1px solid #000;
                    padding: 5px;
                    font-size: 9pt;
                }
                .detail-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                    text-align: center;
                }
                .detail-table td {
                    text-align: center;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 10px;
                }
                .info-item {
                    font-size: 9pt;
                }
                .info-label {
                    font-weight: bold;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .label-section {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="label-container">
                <!-- First Label Section -->
                <div class="label-section">
                    <div class="label-header">
                        <div class="label-title">PALLET LABEL</div>
                        <div class="warehouse-info">
                            <div>MLC-128 WLCTL LOGISTICS</div>
                            <div>(WOBBSBN)</div>
                        </div>
                    </div>
                    
                    <div class="main-content">
                        <div class="sku-info">
                            <div class="sku-code">${pallet.lpnCode}</div>
                            <div class="sku-description">
                                ${pallet.lpnLevel || 'PALLET'}
                            </div>
                        </div>
                        <div class="quantity-box">
                            <div class="quantity-label">Số lượng<br/>thực tế<br/>(Quantity)</div>
                            <div class="quantity-value">${pallet.qty}</div>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Vị trí:</span> ${pallet.location || 'STAGE'}
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ngày:</span> ${dateStr}
                        </div>
                        <div class="info-item">
                            <span class="info-label">Trọng lượng:</span> ${pallet.weightKg ? pallet.weightKg + ' kg' : '-'}
                        </div>
                        <div class="info-item">
                            <span class="info-label">Thể tích:</span> ${pallet.volumeM3 ? pallet.volumeM3 + ' m³' : '-'}
                        </div>
                    </div>

                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Mã hàng</th>
                                <th>Số lượng thực tế</th>
                                <th>ĐVT</th>
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>${pallet.lpnCode}</td>
                                <td>${pallet.qty}</td>
                                <td>PCS</td>
                                <td>${pallet.status}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Second Label Section -->
                <div class="label-section">
                    <div class="barcode-section">
                        <div class="barcode">${generateBarcodeText(barcodeNumber)}</div>
                        <div style="font-size: 10pt; margin-top: 5px;">
                            S# pallet: <strong>${pallet.lpnId || '-'}</strong>
                        </div>
                        <div style="font-size: 10pt;">
                            Mã LPN: <strong>${pallet.lpnCode}</strong>
                        </div>
                        <div style="font-size: 10pt;">
                            Số lô: <strong>BBM-STH</strong>
                        </div>
                        <div style="font-size: 10pt;">
                            Cont: <strong>-</strong>
                        </div>
                    </div>

                    <div class="pallet-number">${pallet.lpnId || pallet.lpnCode}</div>
                    <div class="stage-label">STAGE</div>

                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Mã hàng</th>
                                <th>Số lượng thực tế</th>
                                <th>ĐVT</th>
                                <th>Vị trí</th>
                                <th>Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>${pallet.lpnCode}</td>
                                <td>${pallet.qty}</td>
                                <td>PCS</td>
                                <td>${pallet.location || 'STAGE'}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `;

        // Open print window
        const printWindow = window.open('', '', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();

            // Wait for content to load, then print
            printWindow.onload = () => {
                printWindow.print();
            };
        } else {
            alert('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
        }
    }
}
