import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrandStore } from './brand.store';
import { BrandDrawerStore } from './brand.drawer.store';
import { BrandTableStore } from './brand.table.store';

@Component({
  selector: 'app-brand',
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
    MatIconModule,
    MatPaginatorModule
  ],
  providers: [BrandTableStore, BrandDrawerStore, BrandStore],
  template: `
    <div class="sku-container">
      <div class="sku-header">
        <h1 class="sku-title">Brand</h1>
        <div class="sku-actions">
          <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button>
          <button
            mat-raised-button
            class="btn btn-danger"
            (click)="onDelete()"
            [disabled]="selectedBrands().length === 0"
          >
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
          </button>
          <button
            mat-raised-button
            class="btn btn-secondary"
            (click)="openEditDrawer()"
            [disabled]="selectedBrands().length !== 1"
          >
            <mat-icon>edit</mat-icon>
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Từ khóa</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input
                matInput
                placeholder="Nhập keyword..."
                [(ngModel)]="filters.keyword"
                (input)="applyFilters()"
              />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Mã Brand</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input
                matInput
                placeholder="Lọc theo mã Brand..."
                [(ngModel)]="filters.code"
                (input)="applyClientFilters()"
              />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Tên Brand</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input
                matInput
                placeholder="Lọc theo tên Brand..."
                [(ngModel)]="filters.name"
                (input)="applyClientFilters()"
              />
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
              @if (selectedBrands().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedBrands().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách Brand...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredBrands()" class="warehouse-table">
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let b" class="checkbox-col">
                <mat-checkbox [checked]="isSelected(rowKey(b))" (change)="toggleSelect(rowKey(b))"></mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="brandId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let b"><strong>{{ b.brandId ?? '-' }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="brandCode">
              <th mat-header-cell *matHeaderCellDef>Mã Brand</th>
              <td mat-cell *matCellDef="let b"><strong>{{ b.brandCode }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="brandName">
              <th mat-header-cell *matHeaderCellDef>Tên Brand</th>
              <td mat-cell *matCellDef="let b">{{ b.brandName }}</td>
            </ng-container>

            <ng-container matColumnDef="country">
              <th mat-header-cell *matHeaderCellDef>Quốc gia</th>
              <td mat-cell *matCellDef="let b">{{ b.country ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="manufacturer">
              <th mat-header-cell *matHeaderCellDef>Nhà sản xuất</th>
              <td mat-cell *matCellDef="let b">{{ b.manufacturer ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>Kích hoạt</th>
              <td mat-cell *matCellDef="let b">
                <span class="badge" [class.badge-active]="b.isActive" [class.badge-inactive]="!b.isActive">
                  {{ b.isActive ? 'Có' : 'Không' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="7" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Không tìm thấy Brand nào</p>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              [class.selected-row]="isSelected(rowKey(row))"
            ></tr>
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredBrands().length > 0"></tr>
          </table>
        </div>

        <div class="table-footer">
          <div class="footer-info">
            <span>
              Showing from <strong>{{ fromIndex() }}</strong> to <strong>{{ toIndex() }}</strong> total
              <strong>{{ totalItems() }}</strong>
            </span>
          </div>
          <div class="footer-pages">
            <button mat-icon-button class="page-btn" (click)="prevPage()" [disabled]="page() === 1 || isLoading()">
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
            <button mat-icon-button class="page-btn" (click)="nextPage()" [disabled]="isLastPage() || isLoading()">
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
              {{ drawerMode() === 'create' ? 'Thêm Brand' : 'Cập nhật Brand' }}
            </h2>
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Mã Brand <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.brandCode" name="brandCode" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Tên Brand <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.brandName" name="brandName" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Quốc gia</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.country" name="country" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Nhà sản xuất</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.manufacturer" name="manufacturer" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Trạng thái</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.status" name="status" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Kích hoạt</label>
                <mat-checkbox [(ngModel)]="drawerForm.isActive" name="isActive"></mat-checkbox>
              </div>
            </div>

            <div class="drawer-actions">
              <button mat-stroked-button type="button" class="btn btn-clear" (click)="closeDrawer()">Hủy</button>
              <button mat-raised-button type="submit" class="btn btn-primary" [disabled]="isLoading()">
                {{ drawerMode() === 'create' ? 'Lưu' : 'Cập nhật' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (confirmDeleteOpen()) {
      <div class="confirm-backdrop">
        <div class="confirm-dialog" (click)="$event.stopPropagation()">
          <h2 class="confirm-title">Xác nhận xóa Brand</h2>
          <p class="confirm-message">
            Bạn có chắc chắn muốn xóa <strong>{{ confirmDeleteCount() }}</strong> Brand đã chọn?
          </p>
          <div class="confirm-actions">
            <button mat-stroked-button type="button" class="btn btn-clear" (click)="cancelDelete()">Hủy</button>
            <button
              mat-raised-button
              type="button"
              class="btn btn-danger"
              (click)="confirmDelete()"
              [disabled]="isLoading()"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './brand.component.css'
})
export class BrandComponent {
  private readonly store = inject(BrandStore);

  allBrands = this.store.allBrands;
  filteredBrands = this.store.filteredBrands;
  selectedBrands = this.store.selectedBrands;
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
  set drawerForm(v: any) {
    this.store.drawerForm = v;
  }

  displayedColumns = this.store.displayedColumns;

  get filters() {
    return this.store.filters;
  }
  set filters(v: any) {
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
  isSelected(id: string): boolean {
    return this.store.isSelected(id);
  }
  isSomeSelected(): boolean {
    return this.store.isSomeSelected();
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
  openCreateDrawer(): void {
    this.store.openCreateDrawer();
  }
  openEditDrawer(): void {
    this.store.openEditDrawer();
  }
  closeDrawer(): void {
    this.store.closeDrawer();
  }
  submitDrawer(): void {
    this.store.submitDrawer();
  }

  rowKey = (b: any) => this.store.rowKey(b);
  fromIndex(): number {
    return this.store.fromIndex();
  }
  toIndex(): number {
    return this.store.toIndex();
  }
  pages(): number[] {
    return this.store.pages();
  }

  confirmDeleteOpen = this.store.confirmDeleteOpen;
  confirmDeleteCount = this.store.confirmDeleteCount;
  cancelDelete(): void {
    this.store.cancelDelete();
  }
  confirmDelete(): void {
    this.store.confirmDelete();
  }
}

