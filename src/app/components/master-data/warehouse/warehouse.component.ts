import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import './warehouse.component.css';
import { WcsWarehouseApi } from '../../../api/wcs-warehouse.api';
import { WarehouseDTO } from '../../../api/wcs.models';

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="warehouse-container">
      <div class="warehouse-header">
        <h1 class="warehouse-title">Warehouse</h1>
        <div class="warehouse-actions">
          <button class="btn btn-primary" (click)="openCreateDrawer()">
            <span>➕</span>
            <span>Thêm</span>
          </button>
          <button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedWarehouses().length === 0">
            <span>🗑️</span>
            <span>Xóa</span>
          </button>
          <button class="btn btn-secondary" (click)="openEditDrawer()" [disabled]="selectedWarehouses().length !== 1">
            <span>✏️</span>
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Từ khóa</label>
            <input
              type="text"
              class="filter-input"
              placeholder="Nhập keyword..."
              [(ngModel)]="filters.keyword"
              (input)="applyFilters()"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Mã kho (UI)</label>
            <input
              type="text"
              class="filter-input"
              placeholder="Lọc theo mã kho..."
              [(ngModel)]="filters.code"
              (input)="applyClientFilters()"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Tên kho (UI)</label>
            <input
              type="text"
              class="filter-input"
              placeholder="Lọc nhanh theo tên kho..."
              [(ngModel)]="filters.name"
              (input)="applyClientFilters()"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <select
              class="filter-select"
              [(ngModel)]="filters.status"
              (change)="applyClientFilters()"
              disabled
              title="Backend chưa cung cấp field/status cho Warehouse"
            >
              <option value="">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Loại kho</label>
            <select
              class="filter-select"
              [(ngModel)]="filters.type"
              (change)="applyClientFilters()"
              disabled
              title="Backend chưa cung cấp field/type cho Warehouse"
            >
              <option value="">Tất cả</option>
              <option value="cold">Kho lạnh</option>
              <option value="dry">Kho khô</option>
              <option value="hazardous">Kho nguy hiểm</option>
              <option value="general">Kho thường</option>
            </select>
          </div>
          <div class="filter-group">
            <button class="btn btn-clear" (click)="clearFilters()">
              <span>🔄</span>
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-header-top">
            <div class="table-page-size">
              <span class="page-size-text">Show</span>
              <select
                class="page-size-select"
                [ngModel]="pageSize()"
                (ngModelChange)="onPageSizeChange($event)"
              >
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
              </select>
              <span class="page-size-text">per page</span>
            </div>
            <div class="table-info">
              <span>Tổng số: <strong>{{ totalItems() }}</strong></span>
              @if (selectedWarehouses().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedWarehouses().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách warehouse...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu .</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
            <div class="notice__sub"><a href="http://wcs.aubot.vn:5437/swagger/index.html" target="_blank" rel="noreferrer">Mở Swagger</a></div>
          </div>
        }

        <div class="table-wrapper">
          <table class="warehouse-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    [checked]="isAllSelected()"
                    (change)="toggleSelectAll($event)"
                  />
                </th>
                <th>ID</th>
                <th>Mã kho</th>
                <th>Tên kho</th>
                <th>OwnerId</th>
                <th>OwnerGroupId</th>
              </tr>
            </thead>
            <tbody>
              @if (filteredWarehouses().length === 0) {
                <tr>
                  <td colspan="6" class="empty-state">
                    <div class="empty-message">
                      <span>📦</span>
                      <p>Không tìm thấy kho nào</p>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (warehouse of filteredWarehouses(); track rowKey(warehouse)) {
                  <tr [class.selected]="isSelected(rowKey(warehouse))">
                    <td class="checkbox-col">
                      <input
                        type="checkbox"
                        [checked]="isSelected(rowKey(warehouse))"
                        (change)="toggleSelect(rowKey(warehouse))"
                      />
                    </td>
                    <td><strong>{{ warehouse.warehouseId ?? '-' }}</strong></td>
                    <td><strong>{{ warehouse.warehouseCode }}</strong></td>
                    <td>{{ warehouse.warehouseName }}</td>
                    <td>{{ warehouse.ownerId }}</td>
                    <td>{{ warehouse.ownerGroupId ?? '-' }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <div class="table-footer">
          <div class="footer-info">
            <span>
              Showing from
              <strong>{{ fromIndex() }}</strong>
              to
              <strong>{{ toIndex() }}</strong>
              total
              <strong>{{ totalItems() }}</strong>
            </span>
          </div>
          <div class="footer-pages">
            <button
              class="page-btn"
              (click)="prevPage()"
              [disabled]="page() === 1 || isLoading()"
            >
              ‹
            </button>
            @for (p of pages(); track p) {
              <button
                class="page-number"
                [class.page-number--active]="p === page()"
                (click)="goToPage(p)"
                [disabled]="isLoading()"
              >
                {{ p }}
              </button>
            }
            <button
              class="page-btn"
              (click)="nextPage()"
              [disabled]="isLastPage() || isLoading()"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>

    @if (drawerOpen()) {
      <div class="drawer-backdrop" (click)="closeDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2 class="drawer-title">
              {{ drawerMode() === 'create' ? 'Thêm Warehouse' : 'Cập nhật Warehouse' }}
            </h2>
            <button class="drawer-close" (click)="closeDrawer()">✕</button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-field">
              <label>Mã kho (warehouseCode)</label>
              <input
                type="text"
                required
                [(ngModel)]="drawerForm.warehouseCode"
                name="warehouseCode"
                placeholder="VD: WH-HN-001"
              />
            </div>
            <div class="drawer-field">
              <label>Tên kho (warehouseName)</label>
              <input
                type="text"
                required
                [(ngModel)]="drawerForm.warehouseName"
                name="warehouseName"
                placeholder="VD: Kho Hà Nội"
              />
            </div>
            <div class="drawer-row">
              <div class="drawer-field">
                <label>Owner Id</label>
                <input
                  type="number"
                  required
                  min="1"
                  [(ngModel)]="drawerForm.ownerId"
                  name="ownerId"
                  placeholder="VD: 1"
                />
              </div>
              <div class="drawer-field">
                <label>Owner Group Id</label>
                <input
                  type="number"
                  [(ngModel)]="drawerForm.ownerGroupId"
                  name="ownerGroupId"
                  placeholder="VD: 10"
                />
              </div>
            </div>

            <div class="drawer-actions">
              <button type="button" class="btn btn-clear" (click)="closeDrawer()">
                Hủy
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="isLoading()">
                {{ drawerMode() === 'create' ? 'Lưu' : 'Cập nhật' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './warehouse.component.css'
})
export class WarehouseComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsWarehouseApi);

  allWarehouses = signal<WarehouseDTO[]>([]);
  filteredWarehouses = signal<WarehouseDTO[]>([]);
  selectedWarehouses = signal<string[]>([]);
  page = signal<number>(1);
  pageSize = signal<number>(20);
  isLastPage = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  drawerOpen = signal<boolean>(false);
  drawerMode = signal<'create' | 'edit'>('create');
  drawerForm: { warehouseCode: string; warehouseName: string; ownerId: number | null; ownerGroupId: number | null } = {
    warehouseCode: '',
    warehouseName: '',
    ownerId: null,
    ownerGroupId: null
  };
  private editingWarehouse: WarehouseDTO | null = null;

  filters = {
    name: '',
    code: '',
    status: '',
    type: '',
    keyword: ''
  };

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor() {
    // SSR-safe: Only call backend from browser
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
    // Client-side filters on the fetched list (for UI-only fields)
    let filtered = [...this.allWarehouses()];

    if (this.filters.name) {
      filtered = filtered.filter((w) =>
        (w.warehouseName || '').toLowerCase().includes(this.filters.name.toLowerCase())
      );
    }

    if (this.filters.code) {
      filtered = filtered.filter((w) =>
        (w.warehouseCode || '').toLowerCase().includes(this.filters.code.toLowerCase())
      );
    }

    this.filteredWarehouses.set(filtered);
  }

  clearFilters(): void {
    this.filters = {
      name: '',
      code: '',
      status: '',
      type: '',
      keyword: ''
    };
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  toggleSelect(id: string): void {
    const selected = this.selectedWarehouses();
    if (selected.includes(id)) {
      this.selectedWarehouses.set(selected.filter(s => s !== id));
    } else {
      this.selectedWarehouses.set([...selected, id]);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedWarehouses.set(this.filteredWarehouses().map((w) => this.rowKey(w)));
    } else {
      this.selectedWarehouses.set([]);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedWarehouses().includes(id);
  }

  isAllSelected(): boolean {
    const filtered = this.filteredWarehouses();
    return filtered.length > 0 && filtered.every((w) => this.isSelected(this.rowKey(w)));
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
    if (!Number.isFinite(v) || v <= 0) {
      return;
    }
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
    const selected = this.selectedWarehouses();
    if (selected.length === 0) return;

    if (confirm(`Bạn có chắc chắn muốn xóa ${selected.length} kho đã chọn?`)) {
      const ids = selected
        .map((k) => Number(k))
        .filter((n) => Number.isFinite(n)) as number[];

      if (ids.length === 0) {
        alert('Không xác định được warehouseId để xóa (API yêu cầu id dạng số).');
        return;
      }

      // Fire sequential deletes (simple for now)
      this.isLoading.set(true);
      let done = 0;
      ids.forEach((id) => {
        this.api.deleteWarehouse(id).subscribe({
          next: () => {
            done++;
            if (done === ids.length) {
              this.isLoading.set(false);
              this.reloadFromApi();
              alert(`Đã gửi yêu cầu xóa ${ids.length} kho (check backend response).`);
            }
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
          }
        });
      });
    }
  }

  onUpdate(): void {
    // Kept for backward compatibility if needed
    this.openEditDrawer();
  }

  openCreateDrawer(): void {
    this.drawerMode.set('create');
    this.drawerForm = {
      warehouseCode: '',
      warehouseName: '',
      ownerId: null,
      ownerGroupId: null
    };
    this.editingWarehouse = null;
    this.drawerOpen.set(true);
  }

  openEditDrawer(): void {
    const selected = this.selectedWarehouses();
    if (selected.length !== 1) return;

    const warehouse = this.allWarehouses().find((w) => this.rowKey(w) === selected[0]);
    if (!warehouse) return;

    this.drawerMode.set('edit');
    this.editingWarehouse = warehouse;
    this.drawerForm = {
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.warehouseName,
      ownerId: warehouse.ownerId,
      ownerGroupId: warehouse.ownerGroupId ?? null
    };
    this.drawerOpen.set(true);
  }

  openAddDrawer(): void {
    this.openCreateDrawer();
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingWarehouse = null;
  }

  submitDrawer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const code = (this.drawerForm.warehouseCode || '').trim();
    const name = (this.drawerForm.warehouseName || '').trim();
    const ownerId = this.drawerForm.ownerId;

    if (!code || !name || ownerId == null || !Number.isFinite(ownerId) || ownerId <= 0) {
      alert('Vui lòng nhập đầy đủ và hợp lệ các trường bắt buộc');
      return;
    }

    const payload: WarehouseDTO = {
      warehouseCode: code,
      warehouseName: name,
      ownerId,
      ownerGroupId: this.drawerForm.ownerGroupId ?? undefined
    };

    this.isLoading.set(true);

    if (this.drawerMode() === 'create') {
      this.api.createWarehouse(payload).subscribe({
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
    } else {
      if (this.editingWarehouse?.warehouseId != null) {
        payload.warehouseId = this.editingWarehouse.warehouseId;
      }
      this.api.updateWarehouse(payload).subscribe({
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
  }

  rowKey(w: WarehouseDTO): string {
    return w.warehouseId != null ? String(w.warehouseId) : w.warehouseCode;
  }

  fromIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredWarehouses().length);
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
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

