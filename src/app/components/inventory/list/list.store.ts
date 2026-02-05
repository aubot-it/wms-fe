import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { WcsInventoryApi } from '../../../api/wcs-inventory.api';
import { WcsOwnerApi } from '../../../api/wcs-owner.api';
import {
  InventoryDTO,
  InventoryReleaseType,
  OwnerDTO,
  StatusInventory
} from '../../../api/wcs.models';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class InventoryListStore {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsInventoryApi);
  private readonly ownerApi = inject(WcsOwnerApi);
  private readonly toastr = inject(ToastrService);

  statusOptions: StatusInventory[] = [
    'AVAILABLE',
    'HOLD',
    'DAMAGED',
    'RESERVED',
    'BLOCKED',
    'EXPIRED',
    'COUNTING',
    'MOVING_SCOPE'
  ];

  owners = signal<OwnerDTO[]>([]);
  allItems = signal<InventoryDTO[]>([]);
  page = signal<number>(1);
  pageSize = signal<number>(20);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);
  isLastPage = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  filters: {
    keyword: string;
    ownerId: number | null;
    skuCode: string;
    fromDate: string;
    toDate: string;
    status: '' | StatusInventory;
  } = {
    keyword: '',
    ownerId: null,
    skuCode: '',
    fromDate: '',
    toDate: '',
    status: ''
  };

  displayedColumns: string[] = [
    'inventoryId',
    'skuCode',
    'ownerId',
    'onHandQty',
    'availableQty',
    'reservedQty',
    'expiryDate',
    'inventoryStatus',
    'actions'
  ];

  // Detail panel
  detailOpen = signal<boolean>(false);
  detailInventory = signal<InventoryDTO | null>(null);

  openDetail(inv: InventoryDTO): void {
    this.detailInventory.set(inv);
    this.detailOpen.set(true);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.detailInventory.set(null);
  }

  // Action dialog
  actionDialogOpen = signal<boolean>(false);
  actionType = signal<'adjust' | 'reserve' | 'hold' | 'release'>('adjust');
  selectedInventory = signal<InventoryDTO | null>(null);
  actionQty = signal<number>(0);
  actionReason = signal<string>('');
  // chọn nguồn release
  releaseType = signal<InventoryReleaseType>('HOLD');

  setActionQty(v: number | string): void {
    const n = typeof v === 'string' ? Number(v) : v;
    this.actionQty.set(Number.isFinite(n) ? n : 0);
  }

  setActionReason(v: string): void {
    this.actionReason.set(v ?? '');
  }

  setReleaseType(v: InventoryReleaseType | string): void {
    const val = (v || 'HOLD') as InventoryReleaseType;
    this.releaseType.set(val === 'RESERVED' ? 'RESERVED' : 'HOLD');
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reloadOwners();
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
      ownerId: null,
      skuCode: '',
      fromDate: '',
      toDate: '',
      status: ''
    };
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
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
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    const list = this.allItems();
    return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + list.length);
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  rowKey(item: InventoryDTO): string {
    return item.inventoryId != null ? String(item.inventoryId) : `${item.skuCode}-${item.locationId ?? 0}`;
  }

  ownerKey(o: OwnerDTO): string {
    return o.ownerId != null ? String(o.ownerId) : (o.ownerCode ?? '');
  }

  ownerLabel(ownerId: number): string {
    const o = this.owners().find((x) => x.ownerId === ownerId);
    return o ? `${o.ownerCode} - ${o.ownerName}` : String(ownerId ?? '-');
  }

  private reloadOwners(): void {
    this.ownerApi.getOwnerList({ page: 1, pageSize: 1000 }).subscribe({
      next: (res) => this.owners.set(res.items ?? []),
      error: () => this.owners.set([])
    });
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    const f = this.filters;
    this.api
      .getList({
        keyword: f.keyword.trim() || undefined,
        ownerId: f.ownerId ?? undefined,
        skuCode: f.skuCode.trim() || undefined,
        fromDate: f.fromDate.trim() || undefined,
        toDate: f.toDate.trim() || undefined,
        status: f.status || undefined,
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (res) => {
          this.allItems.set(res.items ?? []);
          const total = res.total ?? (res.items?.length ?? 0);
          this.totalItems.set(total);
          const totalPages = Math.max(1, Math.ceil(total / this.pageSize()));
          this.totalPages.set(totalPages);
          this.isLastPage.set(this.page() >= totalPages || (res.items?.length ?? 0) < this.pageSize());
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
          this.allItems.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLastPage.set(true);
        }
      });
  }

  openActionDialog(item: InventoryDTO, type: 'adjust' | 'reserve' | 'hold' | 'release'): void {
    this.selectedInventory.set(item);
    this.actionType.set(type);
    this.actionQty.set(0);
    this.actionReason.set('');
    if (type === 'release') {
      this.releaseType.set('HOLD');
    }
    this.actionDialogOpen.set(true);
  }

  closeActionDialog(): void {
    this.actionDialogOpen.set(false);
    this.selectedInventory.set(null);
  }

  submitAction(): void {
    const item = this.selectedInventory();
    const type = this.actionType();
    const qty = this.actionQty();
    const reason = this.actionReason();
    if (item?.inventoryId == null) {
      this.toastr.error('Không xác định được bản ghi tồn.');
      return;
    }
    const id = item!.inventoryId!;
    if (!Number.isFinite(qty) || qty === 0) {
      this.toastr.warning('Vui lòng nhập số lượng khác 0.');
      return;
    }
    if (type !== 'adjust' && qty <= 0) {
      this.toastr.warning('Số lượng phải lớn hơn 0.');
      return;
    }
    this.isLoading.set(true);
    const releaseType = this.releaseType();
    const req$ =
      type === 'adjust'
        ? this.api.adjust(id, qty, reason?.trim() || undefined)
        : type === 'reserve'
          ? this.api.reserve(id, qty)
          : type === 'hold'
            ? this.api.hold(id, qty)
            : this.api.release(id, qty, releaseType);

    req$.subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.closeActionDialog();
        this.reloadFromApi();

        const success =
          res && typeof res === 'object' && 'isSuccess' in res ? res.isSuccess !== false : true;
        const msg = (res && typeof res === 'object' && 'message' in res && res.message) || null;

        if (success) {
          const fallback =
            type === 'adjust'
              ? 'Điều chỉnh tồn kho thành công.'
              : type === 'reserve'
                ? 'Reserve thành công.'
                : type === 'hold'
                  ? 'Hold thành công.'
                  : 'Release thành công.';
          this.toastr.success(msg || fallback);
        } else {
          this.toastr.error(msg || 'Thao tác với tồn kho không thành công.');
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
        const msg = backendMsg || fallback || 'Thao tác tồn kho thất bại, vui lòng thử lại.';
        this.errorMessage.set(msg);
        this.toastr.error(msg);
      }
    });
  }
}
