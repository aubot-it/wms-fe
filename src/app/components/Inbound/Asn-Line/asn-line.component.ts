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
import './asn-line.component.css';
import { AsnLineStore } from './asn-line.store';

@Component({
  selector: 'app-asn-line',
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
  providers: [AsnLineStore],
  template: `
    <div class="asn-line-container">
      <div class="asn-line-header">
        <h1 class="asn-line-title">Chi tiết ASN nhập kho</h1>
        <div class="asn-line-actions">
          <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button>
          <button mat-raised-button class="btn btn-info" (click)="printReceipt()" [disabled]="selectedAsnLines().length === 0">
            <mat-icon>print</mat-icon>
            <span>In phiếu nhập</span>
          </button>
          <button mat-raised-button class="btn btn-success" (click)="openLpnDrawer()" [disabled]="selectedAsnLines().length === 0">
            <mat-icon>inventory</mat-icon>
            <span>Tạo Pallet</span>
          </button>
          <button mat-raised-button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedAsnLines().length === 0">
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
          </button>
          <button mat-raised-button class="btn btn-secondary" (click)="openEditDrawer()" [disabled]="selectedAsnLines().length !== 1">
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
            <label class="filter-label">Số ASN</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.asnId" (selectionChange)="applyFilters()">
                  <mat-option value="">Tất cả</mat-option>
                @for (asn of asns(); track asnKey(asn)) {
                  <mat-option [value]="asn.asnId">
                    {{ asn.asnNo }} (ID: {{ asn.asnId }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">SKU</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.skuId" (selectionChange)="applyFilters()">
                  <mat-option value="">Tất cả</mat-option>
                @for (sku of skus(); track skuKey(sku)) {
                  <mat-option [value]="sku.skuID">
                    {{ sku.skuCode }} - {{ sku.skuName }}
                  </mat-option>
                }
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
              @if (selectedAsnLines().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedAsnLines().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách ASN Line...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
            <div class="notice__sub"><a href="http://wcs.aubot.vn:5437/swagger/index.html" target="_blank" rel="noreferrer">Mở Swagger</a></div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredAsnLines()" class="warehouse-table">
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let line" class="checkbox-col">
                <mat-checkbox
                  [checked]="isSelected(rowKey(line))"
                  (change)="toggleSelect(rowKey(line))"
                ></mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="asnLineId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let line"><strong>{{ line.asnLineId ?? '-' }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="asnId">
              <th mat-header-cell *matHeaderCellDef>ASN</th>
              <td mat-cell *matCellDef="let line">{{ asnLabel(line.asnId) }}</td>
            </ng-container>

            <ng-container matColumnDef="skuId">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let line">{{ skuLabel(line.skuId) }}</td>
            </ng-container>

            <ng-container matColumnDef="expectedQty">
              <th mat-header-cell *matHeaderCellDef>Số lượng dự kiến</th>
              <td mat-cell *matCellDef="let line">{{ line.expectedQty }}</td>
            </ng-container>
            <ng-container matColumnDef="createdDate">
              <th mat-header-cell *matHeaderCellDef>Ngày tạo</th>
              <td mat-cell *matCellDef="let line">{{ line.createdDate ? (line.createdDate | date:'short') : '-' }}</td>
            </ng-container>
            <!-- Empty State -->
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="6" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Không tìm thấy ASN Line nào</p>
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
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredAsnLines().length > 0"></tr>
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
              {{ drawerMode() === 'create' ? 'Phân Loại hàng hóa ASN' : 'Cập nhật ASN Line' }}
            </h2>
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">ASN <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <mat-select required [(ngModel)]="drawerForm.asnId" name="asnId">
                  @for (asn of asns(); track asnKey(asn)) {
                    <mat-option [value]="asn.asnId ?? null">
                      {{ asn.asnNo }} (ID: {{ asn.asnId }} - Số lượng SKU: {{asn.numOfSku}})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">SKU <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <mat-select required [(ngModel)]="drawerForm.skuId" name="skuId">
                  @for (sku of skus(); track skuKey(sku)) {
                    <mat-option [value]="sku.skuID ?? null">
                      {{ sku.skuCode }} - {{ sku.skuName }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Số lượng dự kiến <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" required [(ngModel)]="drawerForm.expectedQty" name="expectedQty" min="1" />
              </mat-form-field>
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

    @if (lpnDrawerOpen()) {
      <div class="drawer-backdrop">
        <div class="drawer-panel">
          <div class="drawer-header">
            <h2 class="drawer-title">Tạo Pallet từ ASN Line</h2>
            <button mat-icon-button class="drawer-close" (click)="closeLpnDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitLpnDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">LPN Code <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput required [(ngModel)]="lpnDrawerForm.lpnCode" name="lpnCode" readonly />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">LPN Level <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput required [(ngModel)]="lpnDrawerForm.lpnLevel" name="lpnLevel" readonly />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Số lượng <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field" [class.over-limit]="lpnDrawerForm.qty != null && lpnDrawerForm.qty > 1000">
                <input matInput type="number" required [(ngModel)]="lpnDrawerForm.qty" name="qty" min="1" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Status <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput required [(ngModel)]="lpnDrawerForm.status" name="status" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Trọng lượng (Kg)</label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" [(ngModel)]="lpnDrawerForm.weightKg" name="weightKg" min="0" step="0.01" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Thể tích (M³)</label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" [(ngModel)]="lpnDrawerForm.volumeM3" name="volumeM3" min="0" step="0.01" />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">Ngày đóng</label>
              <div class="datetime-input-wrapper">
                <input type="datetime-local" [(ngModel)]="lpnDrawerForm.closedAt" name="closedAt" class="datetime-input" />
              </div>
            </div>

            <div class="drawer-info">
              <mat-icon>info</mat-icon>
              <span>Đang tạo pallet cho {{ selectedAsnLines().length }} ASN Line đã chọn</span>
            </div>

            <div class="drawer-actions">
              <button mat-stroked-button type="button" class="btn btn-clear" (click)="closeLpnDrawer()">
                Hủy
              </button>
              <button mat-raised-button type="submit" class="btn btn-success" [disabled]="isLoading()">
                Tạo Pallet
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styleUrl: './asn-line.component.css'
})
export class AsnLineComponent {
  private readonly store = inject(AsnLineStore);

  asns = this.store.asns;
  skus = this.store.skus;

  allAsnLines = this.store.allAsnLines;
  filteredAsnLines = this.store.filteredAsnLines;
  selectedAsnLines = this.store.selectedAsnLines;
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

  rowKey = (line: any) => this.store.rowKey(line);
  asnKey = (asn: any) => this.store.asnKey(asn);
  asnLabel = (id: any) => this.store.asnLabel(id);
  skuKey = (sku: any) => this.store.skuKey(sku);
  skuLabel = (id: any) => this.store.skuLabel(id);

  fromIndex(): number {
    return this.store.fromIndex();
  }

  toIndex(): number {
    return this.store.toIndex();
  }

  pages(): number[] {
    return this.store.pages();
  }

  // LPN Methods
  lpnDrawerOpen = this.store.lpnDrawerOpen;
  get lpnDrawerForm() {
    return this.store.lpnDrawerForm;
  }
  set lpnDrawerForm(v: any) {
    this.store.lpnDrawerForm = v;
  }

  openLpnDrawer(): void {
    this.store.openLpnDrawer();
  }

  closeLpnDrawer(): void {
    this.store.closeLpnDrawer();
  }

  submitLpnDrawer(): void {
    this.store.submitLpnDrawer();
  }

  printReceipt(): void {
    this.store.printReceipt();
  }
}
