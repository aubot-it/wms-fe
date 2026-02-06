import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsSkuApi } from '../../../api/wcs-sku.api';
import { SkuDrawerStore } from './sku.drawer.store';
import { SkuTableStore } from './sku.table.store';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class SkuStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsSkuApi);
  private readonly table = inject(SkuTableStore);
  private readonly drawer = inject(SkuDrawerStore);
  private readonly toastr = inject(ToastrService);

  allSkus = this.table.allSkus;
  filteredSkus = this.table.filteredSkus;
  selectedSkus = this.table.selectedSkus;
  page = this.table.page;
  pageSize = this.table.pageSize;
  isLastPage = this.table.isLastPage;
  totalItems = this.table.totalItems;
  totalPages = this.table.totalPages;
  displayedColumns = this.table.displayedColumns;

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

  confirmDeleteOpen = signal<boolean>(false);
  confirmDeleteCount = signal<number>(0);
  private pendingDeleteIds: number[] = [];

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
    this.table.applyClientFilters();
  }

  clearFilters(): void {
    this.table.resetFilters();
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

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

  rowKey = (s: any) => this.table.rowKey(s);

  onDelete(): void {
    const selected = this.selectedSkus();
    if (selected.length === 0) {
      this.toastr.warning('Vui lòng chọn ít nhất 1 SKU để xóa.');
      return;
    }

    const ids = selected.map((id) => Number(id)).filter((n) => Number.isFinite(n)) as number[];
    if (ids.length === 0) {
      this.toastr.error('Không xác định được skuID để xóa.');
      return;
    }

    this.pendingDeleteIds = ids;
    this.confirmDeleteCount.set(ids.length);
    this.confirmDeleteOpen.set(true);
  }

  cancelDelete(): void {
    this.confirmDeleteOpen.set(false);
    this.pendingDeleteIds = [];
  }

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
      this.api.deleteSku(id).subscribe({
        next: (res: any) => {
          done++;
          const success =
            res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
          const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

          if (success) {
            this.toastr.success(msg || `Xóa SKU (ID: ${id}) thành công.`);
          } else {
            this.toastr.error(msg || `Xóa SKU (ID: ${id}) không thành công.`);
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
          const msg = backendMsg || fallback || `Lỗi khi xóa SKU (ID: ${id}).`;
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
    const req$ = isCreate ? this.api.createSku(built.payload) : this.api.updateSku(built.payload);

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
            msg || (isCreate ? 'Tạo SKU thành công.' : 'Cập nhật SKU thành công.')
          );
        } else {
          this.toastr.error(msg || 'Thao tác với SKU không thành công.');
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
        const msg = backendMsg || fallback || 'Lỗi khi lưu SKU, vui lòng thử lại.';
        this.errorMessage.set(msg);
        this.toastr.error(msg);
      }
    });
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api
      .getSkuList({
        keyword: (this.filters.keyword || '').trim(),
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (result) => {
          const list = result.items ?? [];
          const total = result.total ?? list.length;

          this.allSkus.set(list);
          this.applyClientFilters();
          this.selectedSkus.set([]);

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

          this.allSkus.set([]);
          this.filteredSkus.set([]);
          this.selectedSkus.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLastPage.set(true);
        }
      });
  }
}
