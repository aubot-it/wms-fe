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
import './asn.component.css';
import { AsnStore } from './asn.store';
import { APP_CONFIG } from '../../../config/app-config';

@Component({
  selector: 'app-asn',
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
  providers: [AsnStore],
  template: `
    <div class="asn-container">
      <div class="asn-header">
        <h1 class="asn-title">ASN (Advance Shipping Notice)</h1>
        <div class="asn-actions">
          <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button>
          <button mat-raised-button class="btn btn-success" (click)="onExportInvoice()" [disabled]="selectedAsns().length !== 1">
            <mat-icon>receipt</mat-icon>
            <span>Xuất hóa đơn đầu vào</span>
          </button>
          <button mat-raised-button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedAsns().length === 0">
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
          </button>
          <button mat-raised-button class="btn btn-secondary" (click)="openEditDrawer()" [disabled]="selectedAsns().length !== 1">
            <mat-icon>edit</mat-icon>
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Từ khóa (server)</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Nhập keyword..." [(ngModel)]="filters.keyword" (input)="applyFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Warehouse (server)</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.warehouseID" (selectionChange)="applyFilters()">
                <mat-option [value]="">Tất cả</mat-option>
                @for (w of warehouses(); track warehouseKey(w)) {
                  <mat-option [value]="w.warehouseId ?? null">
                    {{ w.warehouseCode }} - {{ w.warehouseName }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Loại ASN</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.asnType" (selectionChange)="applyFilters()">
                <mat-option value="">Tất cả</mat-option>
                @for (t of asnTypes; track t) {
                  <mat-option [value]="t">{{ t }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.status" (selectionChange)="applyFilters()">
                <mat-option value="">Tất cả</mat-option>
                @for (s of asnStatuses; track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Số Asn</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc nhanh theo ASN No..." [(ngModel)]="filters.asnNo" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Tên tài xế</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc nhanh theo driver..." [(ngModel)]="filters.driverName" (input)="applyClientFilters()" />
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
              @if (selectedAsns().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedAsns().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách ASN...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
            @if (swaggerUrl) {
              <div class="notice__sub">
                <a [href]="swaggerUrl" target="_blank" rel="noreferrer">Mở Swagger</a>
              </div>
            }
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredAsns()" class="warehouse-table">
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let asn" class="checkbox-col">
                <mat-checkbox
                  [checked]="isSelected(rowKey(asn))"
                  (change)="toggleSelect(rowKey(asn))"
                ></mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="asnId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let a"><strong>{{ a.asnId ?? '-' }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="asnNo">
              <th mat-header-cell *matHeaderCellDef>Số ASN</th>
              <td mat-cell *matCellDef="let a"><strong>{{ a.asnNo }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="warehouseID">
              <th mat-header-cell *matHeaderCellDef>Kho</th>
              <td mat-cell *matCellDef="let a">{{ warehouseLabel(a.warehouseID) }}</td>
            </ng-container>

            <ng-container matColumnDef="asnType">
              <th mat-header-cell *matHeaderCellDef>Loại ASN</th>
              <td mat-cell *matCellDef="let a">{{ a.asnType }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Trạng thái</th>
              <td mat-cell *matCellDef="let a">{{ a.status }}</td>
            </ng-container>

            <ng-container matColumnDef="driverName">
              <th mat-header-cell *matHeaderCellDef>Tài xế</th>
              <td mat-cell *matCellDef="let a">{{ a.driverName || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="vehicleNo">
              <th mat-header-cell *matHeaderCellDef>Số xe</th>
              <td mat-cell *matCellDef="let a">{{ a.vehicleNo || '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="numOfSku">
              <th mat-header-cell *matHeaderCellDef>Số lượng SKU</th>
              <td mat-cell *matCellDef="let a">{{ a.numOfSku ?? '-' }}</td>
            </ng-container>

            <ng-container matColumnDef="expectedArrival">
              <th mat-header-cell *matHeaderCellDef>Ngày đến dự kiến</th>
              <td mat-cell *matCellDef="let a">{{ a.expectedArrival ? (a.expectedArrival | date:'short') : '-' }}</td>
            </ng-container>

            <!-- Empty State -->
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="9" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Không tìm thấy ASN nào</p>
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
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredAsns().length > 0"></tr>
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
              {{ drawerMode() === 'create' ? 'Thêm ASN' : 'Cập nhật ASN' }}
            </h2>
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">Warehouse <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <mat-select required [(ngModel)]="drawerForm.warehouseID" name="warehouseID">
                  @for (w of warehouses(); track warehouseKey(w)) {
                    <mat-option [value]="w.warehouseId ?? null">
                      {{ w.warehouseCode }} - {{ w.warehouseName }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">ASN No <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.asnNo" name="asnNo" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Chủ sở hữu <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <mat-select required [(ngModel)]="drawerForm.ownerID" name="ownerID">
                    @for (o of owners(); track ownerKey(o)) {
                      <mat-option [value]="o.ownerId ?? null">
                        {{ o.ownerCode }} - {{ o.ownerName }}
                      </mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Loại ASN <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <mat-select required [(ngModel)]="drawerForm.asnType" name="asnType">
                    @for (t of asnTypes; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="drawer-field">
                <label class="drawer-label">Trạng thái <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <mat-select required [(ngModel)]="drawerForm.status" name="status">
                    @for (s of asnStatuses; track s) {
                      <mat-option [value]="s">{{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Tên tài xế</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.driverName" name="driverName" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Số điện thoại</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.driverPhone" name="driverPhone" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Số xe</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.vehicleNo" name="vehicleNo" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Mã tàu</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="drawerForm.carrierID" name="carrierID" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Mã tuyến</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.routeCode" name="routeCode" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Mã bãi</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.dockCode" name="dockCode" />
                </mat-form-field>
              </div>
            </div>


            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Ngày đến dự kiến</label>
                <div class="datetime-input-wrapper">
                  <input type="datetime-local" [(ngModel)]="drawerForm.expectedArrival" name="expectedArrival" class="datetime-input" />
                </div>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Ngày đến thực tế</label>
                <div class="datetime-input-wrapper">
                  <input type="datetime-local" [(ngModel)]="drawerForm.actualArrival" name="actualArrival" class="datetime-input" />
                </div>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Ngày xuất dự kiến</label>
                <div class="datetime-input-wrapper">
                  <input type="datetime-local" [(ngModel)]="drawerForm.expectedDeparture" name="expectedDeparture" class="datetime-input" />
                </div>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Số lượng</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="drawerForm.numOfSku" name="numOfSku" />
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
  styleUrl: './asn.component.css'
})
export class AsnComponent {
  private readonly store = inject(AsnStore);
  readonly swaggerUrl = inject(APP_CONFIG).swaggerUrl;

  asnTypes = this.store.asnTypes;
  asnStatuses = this.store.asnStatuses;

  warehouses = this.store.warehouses;
  owners = this.store.owners;

  allAsns = this.store.allAsns;
  filteredAsns = this.store.filteredAsns;
  selectedAsns = this.store.selectedAsns;
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

  onExportInvoice(): void {
    this.store.onExportInvoice();
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

  rowKey = (a: any) => this.store.rowKey(a);
  warehouseKey = (w: any) => this.store.warehouseKey(w);
  warehouseLabel = (id: any) => this.store.warehouseLabel(id);
  ownerKey = (o: any) => this.store.ownerKey(o);
  ownerLabel = (id: any) => this.store.ownerLabel(id);

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
