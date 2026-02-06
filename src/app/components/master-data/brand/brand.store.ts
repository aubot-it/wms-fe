import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { WcsBrandApi } from '../../../api/wcs-brand.api';
import { BrandDrawerStore } from './brand.drawer.store';
import { BrandTableStore } from './brand.table.store';

@Injectable()
export class BrandStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsBrandApi);
  private readonly table = inject(BrandTableStore);
  private readonly drawer = inject(BrandDrawerStore);
  private readonly toastr = inject(ToastrService);

  allBrands = this.table.allBrands;
  filteredBrands = this.table.filteredBrands;
  selectedBrands = this.table.selectedBrands;
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

  rowKey = (b: any) => this.table.rowKey(b);

  onDelete(): void {
    const selected = this.selectedBrands();
    if (selected.length === 0) {
      this.toastr.warning('Vui lòng chọn ít nhất 1 Brand để xóa.');
      return;
    }

    const ids = selected.map((id) => Number(id)).filter((n) => Number.isFinite(n)) as number[];
    if (ids.length === 0) {
      this.toastr.error('Không xác định được brandId để xóa.');
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
      this.api.deleteBrand(id).subscribe({
        next: (res: any) => {
          done++;
          const success =
            res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
          const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

          if (success) {
            this.toastr.success(msg || `Xóa Brand (ID: ${id}) thành công.`);
          } else {
            this.toastr.error(msg || `Xóa Brand (ID: ${id}) không thành công.`);
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
          const msg = backendMsg || fallback || `Lỗi khi xóa Brand (ID: ${id}).`;
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
    const req$ = isCreate ? this.api.createBrand(built.payload) : this.api.updateBrand(built.payload);

    req$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.closeDrawer();
        this.reloadFromApi();

        const success =
          res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
        const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

        if (success) {
          this.toastr.success(msg || (isCreate ? 'Tạo Brand thành công.' : 'Cập nhật Brand thành công.'));
        } else {
          this.toastr.error(msg || 'Thao tác với Brand không thành công.');
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
        const msg = backendMsg || fallback || 'Lỗi khi lưu Brand, vui lòng thử lại.';
        this.errorMessage.set(msg);
        this.toastr.error(msg);
      }
    });
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api
      .getBrandList({
        keyword: (this.filters.keyword || '').trim(),
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (result) => {
          const list = result.items ?? [];
          const total = result.total ?? list.length;

          this.allBrands.set(list);
          this.applyClientFilters();
          this.selectedBrands.set([]);

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

          this.allBrands.set([]);
          this.filteredBrands.set([]);
          this.selectedBrands.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLastPage.set(true);
        }
      });
  }
}

