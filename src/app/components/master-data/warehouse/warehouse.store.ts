import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsWarehouseApi } from '../../../api/wcs-warehouse.api';
import { WarehouseDrawerStore } from './warehouse.drawer.store';
import { WarehouseTableStore } from './warehouse.table.store';
import { ToastrService } from 'ngx-toastr';

/**
 * Facade store: orchestrates API interaction + composes smaller stores:
 * - WarehouseTableStore (filters/list/pagination/selection)
 * - WarehouseDrawerStore (drawer/form state)
 */
@Injectable()
export class WarehouseStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsWarehouseApi);
  private readonly table = inject(WarehouseTableStore);
  private readonly drawer = inject(WarehouseDrawerStore);
  private readonly toastr = inject(ToastrService);

  // Expose signals/state used by component template
  allWarehouses = this.table.allWarehouses;
  filteredWarehouses = this.table.filteredWarehouses;
  selectedWarehouses = this.table.selectedWarehouses;
  page = this.table.page;
  pageSize = this.table.pageSize;
  isLastPage = this.table.isLastPage;
  totalItems = this.table.totalItems;
  totalPages = this.table.totalPages;
  displayedColumns: string[] = this.table.displayedColumns;

  drawerOpen = this.drawer.drawerOpen;
  drawerMode = this.drawer.drawerMode;
  get drawerForm() {
    return this.drawer.drawerForm;
  }
  set drawerForm(v: any) {
    this.drawer.drawerForm = v;
  }

  get filters() {
    return this.table.filters;
  }
  set filters(v: any) {
    this.table.filters = v;
  }

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Xóa kho: confirm dialog state
  confirmDeleteOpen = signal<boolean>(false);
  confirmDeleteCount = signal<number>(0);
  private pendingDeleteIds: number[] = [];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reloadFromApi();
    }
  }

  // ---------- filters ----------
  applyFilters(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  applyClientFilters(): void {
    this.table.applyClientFilters();
  }

  clearFilters(): void {
    this.table.resetFilters();
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  // ---------- selection ----------
  toggleSelect(id: string): void {
    this.table.toggleSelect(id);
  }

  toggleSelectAll(event: any): void {
    this.table.toggleSelectAll(event);
  }

  isSelected(id: string): boolean {
    return this.table.isSelected(id);
  }

  isSomeSelected(): boolean {
    return this.table.isSomeSelected();
  }

  isAllSelected(): boolean {
    return this.table.isAllSelected();
  }

  // ---------- pagination ----------
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

  fromIndex(): number {
    return this.table.fromIndex();
  }

  toIndex(): number {
    return this.table.toIndex();
  }

  pages(): number[] {
    return this.table.pages();
  }

  rowKey = (w: any) => this.table.rowKey(w);

  // ---------- actions ----------
  /** Bấm nút Xóa: chỉ mở confirm, không gọi API ngay */
  onDelete(): void {
    const selected = this.selectedWarehouses();
    if (selected.length === 0) {
      this.toastr.warning('Vui lòng chọn ít nhất 1 kho để xóa.');
      return;
    }

    const ids = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];
    if (ids.length === 0) {
      this.toastr.error('Không xác định được warehouseId để xóa (API yêu cầu id dạng số).');
      return;
    }

    this.pendingDeleteIds = ids;
    this.confirmDeleteCount.set(ids.length);
    this.confirmDeleteOpen.set(true);
  }

  /** Người dùng hủy confirm xóa */
  cancelDelete(): void {
    this.confirmDeleteOpen.set(false);
    this.pendingDeleteIds = [];
  }

  /** Người dùng xác nhận xóa: gọi API, lấy isSuccess + message để hiện toast */
  confirmDelete(): void {
    const ids = this.pendingDeleteIds;
    if (ids.length === 0) {
      this.confirmDeleteOpen.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.confirmDeleteOpen.set(false);

    let done = 0;
    ids.forEach((id) => {
      this.api.deleteWarehouse(id).subscribe({
        next: (res: any) => {
          done++;

          const success =
            res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
          const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

          if (success) {
            this.toastr.success(msg || `Xóa kho (ID: ${id}) thành công.`);
          } else {
            this.toastr.error(msg || `Xóa kho (ID: ${id}) không thành công.`);
          }

          if (done === ids.length) {
            this.isLoading.set(false);
            this.pendingDeleteIds = [];
            this.reloadFromApi();
          }
        },
        error: (err) => {
          done++;
          const backendMsg =
            (err?.error &&
              typeof err.error === 'object' &&
              'message' in err.error &&
              (err.error as any).message) ||
            (err?.error && typeof err.error === 'string' ? err.error : null);
          const fallback = err?.message || `HTTP ${err?.status ?? ''}`;
          const msg = backendMsg || fallback || `Lỗi khi xóa kho (ID: ${id}).`;
          this.errorMessage.set(msg);
          this.toastr.error(msg);

          if (done === ids.length) {
            this.isLoading.set(false);
            this.pendingDeleteIds = [];
            this.reloadFromApi();
          }
        }
      });
    });
  }

  // ---------- drawer ----------
  openCreateDrawer(): void {
    this.drawer.openCreate();
  }

  openEditDrawer(): void {
    this.drawer.openEdit(this.table);
  }

  closeDrawer(): void {
    this.drawer.close();
  }

  submitDrawer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const built = this.drawer.buildPayload();
    if (!built.ok) {
      this.toastr.warning(built.message);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const isCreate = this.drawerMode() === 'create';
    const req$ = isCreate
      ? this.api.createWarehouse(built.payload)
      : this.api.updateWarehouse(built.payload);

    req$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.closeDrawer();
        this.reloadFromApi();

        const success =
          res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
        const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

        if (success) {
          this.toastr.success(
            msg || (isCreate ? 'Tạo kho thành công.' : 'Cập nhật kho thành công.')
          );
        } else {
          this.toastr.error(msg || 'Thao tác với kho không thành công.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const backendMsg =
          (err?.error &&
            typeof err.error === 'object' &&
            'message' in err.error &&
            (err.error as any).message) ||
          (err?.error && typeof err.error === 'string' ? err.error : null);
        const fallback = err?.message || `HTTP ${err?.status ?? ''}`;
        const msg = backendMsg || fallback || 'Lỗi khi lưu kho, vui lòng thử lại.';
        this.errorMessage.set(msg);
        this.toastr.error(msg);
      }
    });
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api
      .getWarehouseList({
        keyword: (this.filters.keyword || '').trim(),
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (result) => {
          const list = result.items ?? [];
          const total = result.total ?? list.length;

          this.allWarehouses.set(list);
          this.applyClientFilters();
          this.selectedWarehouses.set([]);

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

          this.allWarehouses.set([]);
          this.filteredWarehouses.set([]);
          this.selectedWarehouses.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLastPage.set(true);
        }
      });
  }
}


