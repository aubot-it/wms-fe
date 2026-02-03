import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsInventoryApi } from '../../../api/wcs-inventory.api';
import { InventoryHistoryDTO } from '../../../api/wcs.models';

@Injectable()
export class InventoryHistoryStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsInventoryApi);

  items = signal<InventoryHistoryDTO[]>([]);
  page = signal<number>(1);
  pageSize = signal<number>(20);
  totalItems = signal<number>(0);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  filters: {
    fromDate: string;
    toDate: string;
    skuCode: string;
    keyword: string;
  } = {
    fromDate: '',
    toDate: '',
    skuCode: '',
    keyword: ''
  };

  totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    if (size <= 0) return 1;
    return Math.max(1, Math.ceil(total / size));
  });

  isLastPage = computed(() => this.page() >= this.totalPages());

  fromIndex = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });

  toIndex = computed(() => {
    const from = this.fromIndex();
    const size = this.pageSize();
    const total = this.totalItems();
    return Math.min(from + size - 1, total);
  });

  pages = computed(() => {
    const totalP = this.totalPages();
    const current = this.page();
    const result: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(totalP, current + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalP, start + 4);
      else end = Math.min(totalP, end);
      start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  });

  displayedColumns: string[] = [
    'createdDate',
    'actionType',
    'inventoryId',
    'skuCode',
    'locationId',
    'quantityChange',
    'reason',
    'createdBy'
  ];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  applyFilters(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.load();
  }

  clearFilters(): void {
    this.filters = {
      fromDate: '',
      toDate: '',
      skuCode: '',
      keyword: ''
    };
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.page() === 1 || this.isLoading()) return;
    this.page.update((p) => Math.max(1, p - 1));
    this.load();
  }

  nextPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isLastPage() || this.isLoading()) return;
    this.page.update((p) => p + 1);
    this.load();
  }

  goToPage(p: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const totalP = this.totalPages();
    const page = Math.max(1, Math.min(p, totalP));
    if (page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  onPageSizeChange(size: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.pageSize.set(Math.max(1, size));
    this.page.set(1);
    this.load();
  }

  load(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isLoading.set(true);
    this.errorMessage.set('');

    const fromDate = this.filters.fromDate?.trim() || undefined;
    const toDate = this.filters.toDate?.trim() || undefined;
    const skuCode = this.filters.skuCode?.trim() || undefined;
    const keyword = this.filters.keyword?.trim() || undefined;

    this.api
      .getHistory({
        fromDate,
        toDate,
        skuCode: skuCode || undefined,
        keyword: keyword || undefined,
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.totalItems.set(res.total ?? 0);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.errorMessage.set(err?.message ?? err?.error ?? 'Lỗi tải lịch sử');
          this.items.set([]);
          this.totalItems.set(0);
          this.isLoading.set(false);
        }
      });
  }

  actionTypeLabel(actionType: string | null | undefined): string {
    if (!actionType) return '-';
    const m: Record<string, string> = {
      ADJUST: 'Điều chỉnh',
      RESERVE: 'Reserve',
      HOLD: 'Hold',
      RELEASE: 'Release',
      CREATE: 'Tạo mới',
      UPDATE: 'Cập nhật',
      DELETE: 'Xóa'
    };
    return m[String(actionType).toUpperCase()] ?? actionType;
  }
}
