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
import './sku.component.css';
import { SkuStore } from './sku.store';
import { SkuDrawerStore } from './sku.drawer.store';
import { SkuTableStore } from './sku.table.store';
import { TemperatureType } from '../../../api/wcs.models';

const TEMPERATURE_OPTIONS: TemperatureType[] = ['NORMAL', 'COLD', 'FROZEN'];

@Component({
  selector: 'app-sku',
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
  providers: [SkuTableStore, SkuDrawerStore, SkuStore],
  template: `
    <div class="sku-container">
      <div class="sku-header">
        <h1 class="sku-title">SKU</h1>
        <div class="sku-actions">
          <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button>
          <button mat-raised-button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedSkus().length === 0">
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
          </button>
          <button mat-raised-button class="btn btn-secondary" (click)="openEditDrawer()" [disabled]="selectedSkus().length !== 1">
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
              <input matInput placeholder="Nhập keyword..." [(ngModel)]="filters.keyword" (input)="applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Mã SKU</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc theo mã SKU..." [(ngModel)]="filters.code" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Tên SKU</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc theo tên SKU..." [(ngModel)]="filters.name" (input)="applyClientFilters()" />
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
              @if (selectedSkus().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedSkus().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách SKU...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredSkus()" class="warehouse-table">
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let sku" class="checkbox-col">
                <mat-checkbox
                  [checked]="isSelected(rowKey(sku))"
                  (change)="toggleSelect(rowKey(sku))"
                ></mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="skuID">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let sku"><strong>{{ sku.skuID ?? '-' }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="skuCode">
              <th mat-header-cell *matHeaderCellDef>Mã SKU</th>
              <td mat-cell *matCellDef="let sku"><strong>{{ sku.skuCode }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="skuName">
              <th mat-header-cell *matHeaderCellDef>Tên SKU</th>
              <td mat-cell *matCellDef="let sku">{{ sku.skuName }}</td>
            </ng-container>

            <ng-container matColumnDef="temperatureType">
              <th mat-header-cell *matHeaderCellDef>Nhiệt độ</th>
              <td mat-cell *matCellDef="let sku">{{ sku.temperatureType ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="baseUom">
              <th mat-header-cell *matHeaderCellDef>Base UOM</th>
              <td mat-cell *matCellDef="let sku">{{ sku.baseUom ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="ownerId">
              <th mat-header-cell *matHeaderCellDef>Owner ID</th>
              <td mat-cell *matCellDef="let sku">{{ sku.ownerId ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="brandId">
              <th mat-header-cell *matHeaderCellDef>Brand ID</th>
              <td mat-cell *matCellDef="let sku">{{ sku.brandId ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>Kích hoạt</th>
              <td mat-cell *matCellDef="let sku">
                <span class="badge" [class.badge-active]="sku.isActive" [class.badge-inactive]="!sku.isActive">
                  {{ sku.isActive ? 'Có' : 'Không' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="9" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory</mat-icon>
                  <p>Không tìm thấy SKU nào</p>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr
              mat-row
              *matRowDef="let row; columns: displayedColumns"
              [class.selected-row]="isSelected(rowKey(row))"
            ></tr>
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredSkus().length > 0"></tr>
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
              {{ drawerMode() === 'create' ? 'Thêm SKU' : 'Cập nhật SKU' }}
            </h2>
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Mã SKU <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.skuCode" name="skuCode" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Tên SKU <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.skuName" name="skuName" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Base UOM <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.baseUom" name="baseUom" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Loại nhiệt độ <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <mat-select [(ngModel)]="drawerForm.temperatureType" name="temperatureType" required>
                    @for (t of temperatureOptions; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Owner ID <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.ownerId" name="ownerId" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Brand ID <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.brandId" name="brandId" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Case UOM</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.caseUom" name="caseUom" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Pallet UOM</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.palletUom" name="palletUom" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Case Qty</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="drawerForm.caseQty" name="caseQty" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Pallet Qty</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="drawerForm.palletQty" name="palletQty" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Kiểm soát lô</label>
                <mat-checkbox [(ngModel)]="drawerForm.isBatchControl" name="isBatchControl"></mat-checkbox>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Kiểm soát hạn dùng</label>
                <mat-checkbox [(ngModel)]="drawerForm.isExpiryControl" name="isExpiryControl"></mat-checkbox>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Kiểm soát serial</label>
                <mat-checkbox [(ngModel)]="drawerForm.isSerialControl" name="isSerialControl"></mat-checkbox>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Velocity Class</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.velocityClass" name="velocityClass" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Trọng lượng mặc định (kg)</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="drawerForm.defaultWeightKg" name="defaultWeightKg" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Thể tích mặc định (m³)</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="drawerForm.defaultVolumeM3" name="defaultVolumeM3" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Trạng thái</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.status" name="status" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Kích hoạt</label>
              <mat-checkbox [(ngModel)]="drawerForm.isActive" name="isActive"></mat-checkbox>
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
          <h2 class="confirm-title">Xác nhận xóa SKU</h2>
          <p class="confirm-message">
            Bạn có chắc chắn muốn xóa <strong>{{ confirmDeleteCount() }}</strong> SKU đã chọn?
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
  styleUrl: './sku.component.css'
})
export class SkuComponent {
  private readonly store = inject(SkuStore);

  temperatureOptions = TEMPERATURE_OPTIONS;

  allSkus = this.store.allSkus;
  filteredSkus = this.store.filteredSkus;
  selectedSkus = this.store.selectedSkus;
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

  rowKey = (s: any) => this.store.rowKey(s);
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
