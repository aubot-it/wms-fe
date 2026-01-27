import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import './warehouse.component.css';
import { WcsWarehouseApi } from '../../../api/wcs-warehouse.api';
import { WarehouseDTO } from '../../../api/wcs.models';

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatPaginatorModule,
    MatIconModule
  ],
  template: `
    <div class="warehouse-container">
      <div class="warehouse-header">
        <h1 class="warehouse-title">Warehouse</h1>
        <div class="warehouse-actions">
          <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button>
          <button mat-raised-button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedWarehouses().length === 0">
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
          </button>
          <button mat-raised-button class="btn btn-secondary" (click)="openEditDrawer()" [disabled]="selectedWarehouses().length !== 1">
            <mat-icon>edit</mat-icon>
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Từ khóa</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Nhập keyword..." [(ngModel)]="filters.keyword" (input)="applyFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Mã kho</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc theo mã kho..." [(ngModel)]="filters.code" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Tên kho</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc nhanh theo tên kho..." [(ngModel)]="filters.name" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.status" (selectionChange)="applyClientFilters()" disabled>
                <mat-option value="">Tất cả</mat-option>
                <mat-option value="active">Hoạt động</mat-option>
                <mat-option value="inactive">Ngừng hoạt động</mat-option>
                <mat-option value="maintenance">Bảo trì</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Loại kho</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.type" (selectionChange)="applyClientFilters()" disabled>
                <mat-option value="">Tất cả</mat-option>
                <mat-option value="cold">Kho lạnh</mat-option>
                <mat-option value="dry">Kho khô</mat-option>
                <mat-option value="hazardous">Kho nguy hiểm</mat-option>
                <mat-option value="general">Kho thường</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group button-group">
            <button mat-stroked-button class="btn btn-clear" (click)="clearFilters()">
              <mat-icon>refresh</mat-icon>
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
              <mat-form-field appearance="outline" class="page-size-field">
                <mat-select [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
                  <mat-option [value]="10">10</mat-option>
                  <mat-option [value]="20">20</mat-option>
                  <mat-option [value]="50">50</mat-option>
                </mat-select>
              </mat-form-field>
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
          <table mat-table [dataSource]="filteredWarehouses()" class="warehouse-table">
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let warehouse" class="checkbox-col">
                <mat-checkbox
                  [checked]="isSelected(rowKey(warehouse))"
                  (change)="toggleSelect(rowKey(warehouse))"
                ></mat-checkbox>
              </td>
            </ng-container>

            <!-- ID Column -->
            <ng-container matColumnDef="warehouseId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let warehouse">
                <strong>{{ warehouse.warehouseId ?? '-' }}</strong>
              </td>
            </ng-container>

            <!-- Code Column -->
            <ng-container matColumnDef="warehouseCode">
              <th mat-header-cell *matHeaderCellDef>Mã kho</th>
              <td mat-cell *matCellDef="let warehouse">
                <strong>{{ warehouse.warehouseCode }}</strong>
              </td>
            </ng-container>

            <!-- Name Column -->
            <ng-container matColumnDef="warehouseName">
              <th mat-header-cell *matHeaderCellDef>Tên kho</th>
              <td mat-cell *matCellDef="let warehouse">{{ warehouse.warehouseName }}</td>
            </ng-container>

            <!-- OwnerId Column -->
            <ng-container matColumnDef="ownerId">
              <th mat-header-cell *matHeaderCellDef>OwnerId</th>
              <td mat-cell *matCellDef="let warehouse">{{ warehouse.ownerId }}</td>
            </ng-container>

            <!-- OwnerGroupId Column -->
            <ng-container matColumnDef="ownerGroupId">
              <th mat-header-cell *matHeaderCellDef>OwnerGroupId</th>
              <td mat-cell *matCellDef="let warehouse">{{ warehouse.ownerGroupId ?? '-' }}</td>
            </ng-container>

            <!-- Empty State -->
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="6" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Không tìm thấy kho nào</p>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns" [class.selected-row]="isSelected(rowKey(row))"></tr>
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredWarehouses().length > 0"></tr>
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
              mat-icon-button
              class="page-btn"
              (click)="prevPage()"
              [disabled]="page() === 1 || isLoading()"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            @for (p of pages(); track p) {
              <button
                mat-mini-fab
                class="page-number"
                [class.page-number--active]="p === page()"
                (click)="goToPage(p)"
                [disabled]="isLoading()"
              >
                {{ p }}
              </button>
            }
            <button
              mat-icon-button
              class="page-btn"
              (click)="nextPage()"
              [disabled]="isLastPage() || isLoading()"
            >
              <mat-icon>chevron_right</mat-icon>
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
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">Mã kho (warehouseCode) <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="text" required [(ngModel)]="drawerForm.warehouseCode" name="warehouseCode" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Tên kho (warehouseName) <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="text" required [(ngModel)]="drawerForm.warehouseName" name="warehouseName" />
              </mat-form-field>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Chủ sở hữu <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.ownerId" name="ownerId" />
                </mat-form-field>
              </div>

              <div class="drawer-field">
                <label class="drawer-label">Group</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.ownerGroupId" name="ownerGroupId" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-actions">
              <button mat-stroked-button type="button" class="btn btn-clear" (click)="closeDrawer()">
                Hủy
              </button>
              <button mat-raised-button type="submit" class="btn btn-primary" [disabled]="isLoading()">
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
  drawerForm: { warehouseCode: string; warehouseName: string; ownerId: string; ownerGroupId: string } = {
    warehouseCode: '',
    warehouseName: '',
    ownerId: '',
    ownerGroupId: ''
  };
  private editingWarehouse: WarehouseDTO | null = null;

  displayedColumns: string[] = ['select', 'warehouseId', 'warehouseCode', 'warehouseName', 'ownerId', 'ownerGroupId'];

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

  toggleSelectAll(event: any): void {
    const checked = event.checked;
    if (checked) {
      this.selectedWarehouses.set(this.filteredWarehouses().map((w) => this.rowKey(w)));
    } else {
      this.selectedWarehouses.set([]);
    }
  }

  isSomeSelected(): boolean {
    const filtered = this.filteredWarehouses();
    const selectedCount = filtered.filter((w) => this.isSelected(this.rowKey(w))).length;
    return selectedCount > 0 && selectedCount < filtered.length;
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
      ownerId: '',
      ownerGroupId: ''
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
      ownerGroupId: warehouse.ownerGroupId || ''
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
    const ownerId = (this.drawerForm.ownerId || '').trim();
    const ownerGroupId = (this.drawerForm.ownerGroupId || '').trim();

    if (!code || !name || !ownerId) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    const payload: WarehouseDTO = {
      warehouseCode: code,
      warehouseName: name,
      ownerId,
      ownerGroupId: ownerGroupId || undefined
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

