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
        'expectedQty',
        'createdDate'
    ];

    filters: {
        keyword: string;
        asnId: number | string | null | undefined;
        skuId: number | string | null | undefined;
    } = {
            keyword: '',
            asnId: '',
            skuId: ''
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
            asnId: '',
            skuId: ''
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
            asnId: this.filters.asnId === '' || this.filters.asnId == null ? null : (this.filters.asnId as number),
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

        // Convert empty string to undefined for API
        const asnId = this.filters.asnId === '' ? undefined : (this.filters.asnId as number | undefined);
        const skuId = this.filters.skuId === '' ? undefined : (this.filters.skuId as number | undefined);

        this.api
            .getAsnLineList({
                keyword: (this.filters.keyword || '').trim(),
                asnId,
                skuId,
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

        // Calculate total quantity from selected ASN lines
        const totalQty = this.allAsnLines()
            .filter((line) => selected.includes(this.rowKey(line)))
            .reduce((sum, line) => sum + (line.expectedQty || 0), 0);

        this.lpnDrawerForm = {
            lpnCode: '',
            lpnLevel: '',
            qty: totalQty,
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

    printReceipt(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const selected = this.selectedAsnLines();
        if (selected.length === 0) {
            alert('Vui lòng chọn ít nhất 1 ASN Line để in phiếu.');
            return;
        }

        // Get selected ASN lines with full details
        const selectedLines = this.allAsnLines().filter((line) => selected.includes(this.rowKey(line)));

        // Get ASN info from first line (assuming all selected lines are from same ASN)
        const firstLine = selectedLines[0];
        const asnInfo = this.asns().find((a) => a.asnId === firstLine.asnId);

        // Generate current date and time
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN');
        const timeStr = now.toLocaleTimeString('vi-VN');

        // Create print content
        let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Phiếu Kiểm Đếm Chi Tiết Hàng Nhập</title>
            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-size: 11pt;
                    line-height: 1.4;
                    margin: 0;
                    padding: 20px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                }
                .logo {
                    font-size: 20pt;
                    font-weight: bold;
                    color: #4CAF50;
                }
                .company-info {
                    text-align: left;
                    font-size: 9pt;
                }
                .title {
                    text-align: center;
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 15px 0;
                    text-transform: uppercase;
                }
                .subtitle {
                    text-align: center;
                    font-size: 12pt;
                    margin-bottom: 20px;
                    color: #666;
                }
                .info-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 15px;
                    font-size: 10pt;
                }
                .info-row {
                    display: flex;
                    margin-bottom: 5px;
                }
                .info-label {
                    font-weight: bold;
                    min-width: 150px;
                }
                .info-value {
                    flex: 1;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 10pt;
                }
                th {
                    background-color: #f0f0f0;
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                    font-weight: bold;
                }
                td {
                    border: 1px solid #333;
                    padding: 8px;
                    text-align: center;
                }
                td.left {
                    text-align: left;
                }
                .footer {
                    margin-top: 30px;
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    page-break-inside: avoid;
                }
                .signature-box {
                    text-align: center;
                }
                .signature-title {
                    font-weight: bold;
                    margin-bottom: 60px;
                }
                .signature-name {
                    border-top: 1px solid #333;
                    padding-top: 5px;
                    margin-top: 60px;
                }
                @media print {
                    body {
                        padding: 0;
                    }
                    .no-print {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div>
                    <div class="logo">VNHO</div>
                    <div class="company-info">Logistics</div>
                </div>
                <div style="text-align: right; font-size: 9pt;">
                    <div><strong>Ngày:</strong> ${dateStr}</div>
                    <div><strong>Giờ:</strong> ${timeStr}</div>
                </div>
            </div>

            <div class="title">PHIẾU KIỂM ĐẾM CHI TIẾT HÀNG NHẬP</div>
            <div class="subtitle">INBOUND TALLY SHEET</div>

            <div class="info-section">
                <div>
                    <div class="info-row">
                        <span class="info-label">Ngày:</span>
                        <span class="info-value">${dateStr}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Số ASN:</span>
                        <span class="info-value">${asnInfo?.asnNo || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Khách hàng:</span>
                        <span class="info-value">_______________________</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Hình thức xuống hàng:</span>
                        <span class="info-value">☐ Mỏ bên trong pallet ☐ Bốc dỡ</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">Thời gian bắt đầu xuống hàng:</span>
                        <span class="info-value">_________________</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Thời gian kết thúc xuống hàng:</span>
                        <span class="info-value">_________________</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Số lượng pallet/kiện hàng:</span>
                        <span class="info-value">_________________</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cần đổi cart (gạnh) (C/D/Không):</span>
                        <span class="info-value">_________________</span>
                    </div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th rowspan="2">STT</th>
                        <th rowspan="2">Mã hàng</th>
                        <th rowspan="2">Tên hàng</th>
                        <th colspan="3">Số lượng</th>
                        <th rowspan="2">Đơn vị tính</th>
                        <th rowspan="2">Nơi lưu kho</th>
                        <th rowspan="2">Ghi chú</th>
                    </tr>
                    <tr>
                        <th>Số lượng<br/>theo đơn</th>
                        <th>Số lượng<br/>thực nhận</th>
                        <th>Số lượng<br/>chênh lệch</th>
                    </tr>
                </thead>
                <tbody>
        `;

        selectedLines.forEach((line, index) => {
            const sku = this.skus().find((s) => s.skuID === line.skuId);
            printContent += `
                    <tr>
                        <td>${index + 1}</td>
                        <td class="left">${sku?.skuCode || '-'}</td>
                        <td class="left">${sku?.skuName || '-'}</td>
                        <td>${line.expectedQty || 0}</td>
                        <td></td>
                        <td></td>
                        <td>${sku?.baseUom || '-'}</td>
                        <td></td>
                        <td></td>
                    </tr>
            `;
        });

        // Add empty rows to fill the page
        const emptyRows = Math.max(0, 10 - selectedLines.length);
        for (let i = 0; i < emptyRows; i++) {
            printContent += `
                    <tr>
                        <td>${selectedLines.length + i + 1}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
            `;
        }

        printContent += `
                </tbody>
            </table>

            <div class="info-section" style="margin-top: 20px;">
                <div>
                    <div class="info-row">
                        <span class="info-label">Số lượng SKU:</span>
                        <span class="info-value">${selectedLines.length}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Tổng số lượng dự kiến:</span>
                        <span class="info-value">${selectedLines.reduce((sum, l) => sum + (l.expectedQty || 0), 0)}</span>
                    </div>
                </div>
                <div>
                    <div class="info-row">
                        <span class="info-label">Tổng số lượng thực nhận:</span>
                        <span class="info-value">_________________</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Số lượng chênh lệch:</span>
                        <span class="info-value">_________________</span>
                    </div>
                </div>
            </div>

            <div class="footer">
                <div class="signature-box">
                    <div class="signature-title">Người lập phiếu</div>
                    <div class="signature-name">(Ký và ghi rõ họ tên)</div>
                </div>
                <div class="signature-box">
                    <div class="signature-title">Nhân viên kho</div>
                    <div class="signature-name">(Ký và ghi rõ họ tên)</div>
                </div>
                <div class="signature-box">
                    <div class="signature-title">Quản lý kho</div>
                    <div class="signature-name">(Ký và ghi rõ họ tên)</div>
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
                // Don't close automatically - let user close it
            };
        } else {
            alert('Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt.');
        }
    }
}
