import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { WarehouseStore } from './warehouse.store';
import { WarehouseDrawerStore } from './warehouse.drawer.store';
import { WarehouseTableStore } from './warehouse.table.store';

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
  providers: [WarehouseTableStore, WarehouseDrawerStore, WarehouseStore],
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
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              [class.selected-row]="isSelected(rowKey(row))"
              [style.background-color]="isSelected(rowKey(row)) ? '#dbeafe' : ''"
              [style.border-left]="isSelected(rowKey(row)) ? '4px solid #3b82f6' : ''"
            ></tr>
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
      <div class="drawer-backdrop">
        <div class="drawer-panel">
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
  private readonly store = inject(WarehouseStore);


  allWarehouses = this.store.allWarehouses;
  filteredWarehouses = this.store.filteredWarehouses;
  selectedWarehouses = this.store.selectedWarehouses;
  page = this.store.page;
  pageSize = this.store.pageSize;
  isLastPage = this.store.isLastPage;
  totalItems = this.store.totalItems;
  totalPages = this.store.totalPages;

  drawerOpen = this.store.drawerOpen;
  drawerMode = this.store.drawerMode;
  get drawerForm() {
    return this.store.drawerForm;
  }
  set drawerForm(v: { warehouseCode: string; warehouseName: string; ownerId: string; ownerGroupId: string }) {
    this.store.drawerForm = v;
  }

  displayedColumns: string[] = this.store.displayedColumns;

  get filters() {
    return this.store.filters;
  }
  set filters(v: { name: string; code: string; status: string; type: string; keyword: string }) {
    this.store.filters = v;
  }

  isLoading = this.store.isLoading;
  errorMessage = this.store.errorMessage;

  applyFilters(): void {
    this.store.applyFilters();
  }

  applyClientFilters(): void {
    this.store.applyClientFilters();
  }

  clearFilters(): void {
    this.store.clearFilters();
  }

  toggleSelect(id: string): void {
    this.store.toggleSelect(id);
  }

  toggleSelectAll(event: any): void {
    this.store.toggleSelectAll(event);
  }

  isSomeSelected(): boolean {
    return this.store.isSomeSelected();
  }

  isSelected(id: string): boolean {
    return this.store.isSelected(id);
  }

  isAllSelected(): boolean {
    return this.store.isAllSelected();
  }

  prevPage(): void {
    this.store.prevPage();
  }

  nextPage(): void {
    this.store.nextPage();
  }

  onPageSizeChange(size: number | string): void {
    this.store.onPageSizeChange(size);
  }

  goToPage(p: number): void {
    this.store.goToPage(p);
  }

  onDelete(): void {
    this.store.onDelete();
  }

  onUpdate(): void {
    // Kept for backward compatibility if needed
    this.openEditDrawer();
  }

  openCreateDrawer(): void {
    this.store.openCreateDrawer();
  }

  openEditDrawer(): void {
    this.store.openEditDrawer();
  }

  openAddDrawer(): void {
    this.openCreateDrawer();
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  submitDrawer(): void {
    this.store.submitDrawer();
  }

  rowKey = (w: any) => this.store.rowKey(w);

  fromIndex(): number {
    return this.store.fromIndex();
  }

  toIndex(): number {
    return this.store.toIndex();
  }

  pages(): number[] {
    return this.store.pages();
  }
}

