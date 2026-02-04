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
import './pallet.component.css';
import { PalletStore } from './pallet.store';

@Component({
  selector: 'app-pallet',
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
    MatIconModule
  ],
  providers: [PalletStore],
  template: `
    <div class="pallet-container">
      <div class="pallet-header">
        <h1 class="pallet-title">Quản lý Pallet (LPN)</h1>
        <div class="pallet-actions">
          <!-- <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button> -->
          <button mat-raised-button class="btn btn-info" (click)="printPallet()" [disabled]="selectedPallets().length !== 1 || !isSelectedPalletConfirmed()">
            <mat-icon>print</mat-icon>
            <span>In Pallet</span>
          </button>
          <button mat-raised-button class="btn btn-success" (click)="onConfirmPallet()" [disabled]="selectedPallets().length !== 1">
            <mat-icon>check_circle</mat-icon>
            <span>Xác nhận Pallet</span>
          </button>
          <button mat-raised-button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedPallets().length === 0">
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
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
            <label class="filter-label">Mã Pallet</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc theo LPN Code..." [(ngModel)]="filters.lpnCode" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Vị trí</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc theo Location..." [(ngModel)]="filters.location" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.status" (selectionChange)="applyClientFilters()">
                <mat-option value="">Tất cả</mat-option>
                <mat-option value="NEW">NEW</mat-option>
                <mat-option value="CONFIRMED">CONFIRMED</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group button-group">
            <button mat-stroked-button class="btn btn-clear" (click)="clearFilters()">
              <mat-icon>refresh</mat-icon>
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-header-top">
            <div class="table-page-size">
              <span class="page-size-text">Hiển thị</span>
              <mat-form-field appearance="outline" class="page-size-field">
                <mat-select [ngModel]="pageSize()" (ngModelChange)="onPageSizeChange($event)">
                  <mat-option [value]="10">10</mat-option>
                  <mat-option [value]="20">20</mat-option>
                  <mat-option [value]="50">50</mat-option>
                </mat-select>
              </mat-form-field>
              <span class="page-size-text">trên trang</span>
            </div>
            <div class="table-info">
              <span>Tổng số: <strong>{{ totalItems() }}</strong></span>
              @if (selectedPallets().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedPallets().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách Pallet...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
            <div class="notice__sub"><a href="http://wcs.aubot.vn:5437/swagger/index.html" target="_blank" rel="noreferrer">Mở Swagger</a></div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredPallets()" class="warehouse-table">
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let pallet" class="checkbox-col">
                <mat-checkbox
                  [checked]="isSelected(rowKey(pallet))"
                  (change)="toggleSelect(rowKey(pallet))"
                ></mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="lpnId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let p"><strong>{{ p.lpnId ?? '-' }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="lpnCode">
              <th mat-header-cell *matHeaderCellDef>LPN Code</th>
              <td mat-cell *matCellDef="let p"><strong>{{ p.lpnCode }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="location">
              <th mat-header-cell *matHeaderCellDef>Location</th>
              <td mat-cell *matCellDef="let p">{{ p.location || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="lpnLevel">
              <th mat-header-cell *matHeaderCellDef>Level</th>
              <td mat-cell *matCellDef="let p">{{ p.lpnLevel }}</td>
            </ng-container>

            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>Quantity</th>
              <td mat-cell *matCellDef="let p">{{ p.qty }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let p">
                <span [class]="'status-badge status-' + (p.status || 'unknown').toLowerCase()">
                  {{ p.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="weightKg">
              <th mat-header-cell *matHeaderCellDef>Weight (kg)</th>
              <td mat-cell *matCellDef="let p">{{ p.weightKg ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="closedAt">
              <th mat-header-cell *matHeaderCellDef>Closed At</th>
              <td mat-cell *matCellDef="let p">{{ p.closedAt ? (p.closedAt | date:'short') : '-' }}</td>
            </ng-container>

            <!-- Empty State -->
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="9" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Không tìm thấy Pallet nào</p>
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
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredPallets().length > 0"></tr>
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
            <h2 class="drawer-title">Tạo Pallet mới</h2>
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">LPN Code <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput required [(ngModel)]="drawerForm.lpnCode" name="lpnCode" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">LPN Level <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput required [(ngModel)]="drawerForm.lpnLevel" name="lpnLevel" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Số lượng <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" required [(ngModel)]="drawerForm.qty" name="qty" min="1" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Status <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <mat-select required [(ngModel)]="drawerForm.status" name="status">
                  <mat-option value="NEW">NEW</mat-option>
                  <mat-option value="CONFIRMED">CONFIRMED</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Location</label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput [(ngModel)]="drawerForm.location" name="location" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Trọng lượng (Kg)</label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" [(ngModel)]="drawerForm.weightKg" name="weightKg" min="0" step="0.01" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Thể tích (M³)</label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" [(ngModel)]="drawerForm.volumeM3" name="volumeM3" min="0" step="0.01" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Ngày đóng</label>
              <div class="datetime-input-wrapper">
                <input type="datetime-local" [(ngModel)]="drawerForm.closedAt" name="closedAt" class="datetime-input" />
              </div>
            </div>

            <div class="drawer-actions">
              <button mat-stroked-button type="button" class="btn btn-clear" (click)="closeDrawer()">
                Hủy
              </button>
              <button mat-raised-button type="submit" class="btn btn-primary" [disabled]="isLoading()">
                Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './pallet.component.css'
})
export class PalletComponent {
  private readonly store = inject(PalletStore);

  allPallets = this.store.allPallets;
  filteredPallets = this.store.filteredPallets;
  selectedPallets = this.store.selectedPallets;
  page = this.store.page;
  pageSize = this.store.pageSize;
  isLastPage = this.store.isLastPage;
  totalItems = this.store.totalItems;
  totalPages = this.store.totalPages;

  drawerOpen = this.store.drawerOpen;
  get drawerForm() {
    return this.store.drawerForm;
  }
  set drawerForm(v: any) {
    this.store.drawerForm = v;
  }

  displayedColumns: string[] = this.store.displayedColumns;

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

  onConfirmPallet(): void {
    this.store.onConfirmPallet();
  }

  openCreateDrawer(): void {
    this.store.openCreateDrawer();
  }

  closeDrawer(): void {
    this.store.closeDrawer();
  }

  submitDrawer(): void {
    this.store.submitDrawer();
  }

  rowKey = (p: any) => this.store.rowKey(p);

  fromIndex(): number {
    return this.store.fromIndex();
  }

  toIndex(): number {
    return this.store.toIndex();
  }

  pages(): number[] {
    return this.store.pages();
  }

  printPallet(): void {
    this.store.printPallet();
  }

  isSelectedPalletConfirmed(): boolean {
    return this.store.isSelectedPalletConfirmed();
  }
}
