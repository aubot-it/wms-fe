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
          <button class="btn btn-primary" (click)="onAdd()">
            <span>➕</span>
            <span>Thêm</span>
          </button>
          <button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedWarehouses().length === 0">
            <span>🗑️</span>
            <span>Xóa</span>
          </button>
          <button class="btn btn-secondary" (click)="onUpdate()" [disabled]="selectedWarehouses().length !== 1">
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
          <div class="table-info">
            <span>Tổng số: <strong>{{ filteredWarehouses().length }}</strong></span>
            @if (selectedWarehouses().length > 0) {
              <span class="selected-info">Đã chọn: <strong>{{ selectedWarehouses().length }}</strong></span>
            }
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
      </div>
    </div>
  `,
  styleUrl: './warehouse.component.css'
})
export class WarehouseComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsWarehouseApi);

  allWarehouses = signal<WarehouseDTO[]>([]);
  filteredWarehouses = signal<WarehouseDTO[]>([]);
  selectedWarehouses = signal<string[]>([]);

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
    const selected = this.selectedWarehouses();
    if (selected.length !== 1) return;

    const warehouse = this.allWarehouses().find((w) => this.rowKey(w) === selected[0]);
    if (!warehouse) return;

    const newName = prompt('Nhập warehouseName mới:', warehouse.warehouseName);
    if (!newName) return;

    this.isLoading.set(true);
    this.api
      .updateWarehouse({ ...warehouse, warehouseName: newName })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.reloadFromApi();
          alert(`Đã gửi yêu cầu cập nhật kho "${warehouse.warehouseCode}" (check backend response).`);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
        }
      });
  }

  onAdd(): void {
    const warehouseCode = prompt('Nhập warehouseCode:', 'WH-NEW-001');
    if (!warehouseCode) return;
    const warehouseName = prompt('Nhập warehouseName:', 'Kho mới');
    if (!warehouseName) return;
    const ownerIdStr = prompt('Nhập ownerId (number):', '1');
    if (!ownerIdStr) return;
    const ownerId = Number(ownerIdStr);
    if (!Number.isFinite(ownerId)) {
      alert('ownerId không hợp lệ');
      return;
    }

    this.isLoading.set(true);
    this.api
      .createWarehouse({ warehouseCode, warehouseName, ownerId })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.reloadFromApi();
          alert('Đã gửi yêu cầu tạo kho (check backend response).');
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.message || `HTTP ${err?.status ?? ''}`);
        }
      });
  }

  rowKey(w: WarehouseDTO): string {
    return w.warehouseId != null ? String(w.warehouseId) : w.warehouseCode;
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api.getWarehouseList({ keyword: (this.filters.keyword || '').trim(), page: 1, pageSize: 100 }).subscribe({
      next: (rows) => {
        this.allWarehouses.set(rows ?? []);
        this.applyClientFilters();
        this.selectedWarehouses.set([]);
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
      }
    });
  }
}

