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
import './zone.component.css';
import { ZoneStore } from './zone.store';

@Component({
  selector: 'app-zone',
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
  providers: [ZoneStore],
  template: `
    <div class="zone-container">
      <div class="zone-header">
        <h1 class="zone-title">Zone</h1>
        <div class="zone-actions">
          <button mat-raised-button class="btn btn-primary" (click)="openCreateDrawer()">
            <mat-icon>add</mat-icon>
            <span>Thêm</span>
          </button>
          <button mat-raised-button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedZones().length === 0">
            <mat-icon>delete</mat-icon>
            <span>Xóa</span>
          </button>
          <button mat-raised-button class="btn btn-secondary" (click)="openEditDrawer()" [disabled]="selectedZones().length !== 1">
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
              <mat-select [(ngModel)]="filters.warehouseId" (selectionChange)="applyFilters()">
                <mat-option [value]="null">Tất cả</mat-option>
                @for (w of warehouses(); track warehouseKey(w)) {
                  <mat-option [value]="w.warehouseId ?? null">
                    {{ w.warehouseCode }} - {{ w.warehouseName }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Temperature (server)</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.temperatureControlType" (selectionChange)="applyFilters()">
                <mat-option value="">Tất cả</mat-option>
                @for (t of temperatureTypes; track t) {
                  <mat-option [value]="t">{{ t }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Usage (server)</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="filters.zoneUsage" (selectionChange)="applyFilters()">
                <mat-option value="">Tất cả</mat-option>
                @for (u of zoneUsages; track u) {
                  <mat-option [value]="u">{{ u }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Mã zone (client)</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc nhanh theo zoneCode..." [(ngModel)]="filters.code" (input)="applyClientFilters()" />
            </mat-form-field>
          </div>

          <div class="filter-group">
            <label class="filter-label">Tên zone (client)</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Lọc nhanh theo zoneName..." [(ngModel)]="filters.name" (input)="applyClientFilters()" />
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
              @if (selectedZones().length > 0) {
                <span class="selected-info">Đã chọn: <strong>{{ selectedZones().length }}</strong></span>
              }
            </div>
          </div>
        </div>

        @if (isLoading()) {
          <div class="notice notice--info">Đang tải danh sách zone...</div>
        }
        @if (errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ errorMessage() }}</div>
            <div class="notice__sub"><a href="http://wcs.aubot.vn:5437/swagger/index.html" target="_blank" rel="noreferrer">Mở Swagger</a></div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredZones()" class="warehouse-table">
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef class="checkbox-col">
                <mat-checkbox
                  [checked]="isAllSelected()"
                  (change)="toggleSelectAll($event)"
                  [indeterminate]="isSomeSelected()"
                ></mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let zone" class="checkbox-col">
                <mat-checkbox
                  [checked]="isSelected(rowKey(zone))"
                  (change)="toggleSelect(rowKey(zone))"
                ></mat-checkbox>
              </td>
            </ng-container>

            <ng-container matColumnDef="zoneID">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let z"><strong>{{ z.zoneID ?? '-' }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="zoneCode">
              <th mat-header-cell *matHeaderCellDef>ZoneCode</th>
              <td mat-cell *matCellDef="let z"><strong>{{ z.zoneCode }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="zoneName">
              <th mat-header-cell *matHeaderCellDef>ZoneName</th>
              <td mat-cell *matCellDef="let z">{{ z.zoneName }}</td>
            </ng-container>

            <ng-container matColumnDef="warehouse">
              <th mat-header-cell *matHeaderCellDef>Warehouse</th>
              <td mat-cell *matCellDef="let z">{{ warehouseLabel(z.warehouseId) }}</td>
            </ng-container>

            <ng-container matColumnDef="temperatureControlType">
              <th mat-header-cell *matHeaderCellDef>Temp</th>
              <td mat-cell *matCellDef="let z">{{ z.temperatureControlType }}</td>
            </ng-container>

            <ng-container matColumnDef="zoneUsage">
              <th mat-header-cell *matHeaderCellDef>Usage</th>
              <td mat-cell *matCellDef="let z">{{ z.zoneUsage }}</td>
            </ng-container>

            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef>Active</th>
              <td mat-cell *matCellDef="let z">{{ z.isActive == null ? '-' : (z.isActive ? 'Yes' : 'No') }}</td>
            </ng-container>

            <!-- Empty State -->
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="8" class="empty-state">
                <div class="empty-message">
                  <mat-icon>grid_view</mat-icon>
                  <p>Không tìm thấy zone nào</p>
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
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="filteredZones().length > 0"></tr>
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
              {{ drawerMode() === 'create' ? 'Thêm Zone' : 'Cập nhật Zone' }}
            </h2>
            <button mat-icon-button class="drawer-close" (click)="closeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">Warehouse <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <mat-select required [(ngModel)]="drawerForm.warehouseId" name="warehouseId">
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
                <label class="drawer-label">ZoneCode <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.zoneCode" name="zoneCode" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">ZoneName <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" required [(ngModel)]="drawerForm.zoneName" name="zoneName" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Temperature <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <mat-select required [(ngModel)]="drawerForm.temperatureControlType" name="temperatureControlType">
                    @for (t of temperatureTypes; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="drawer-field">
                <label class="drawer-label">Usage <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <mat-select required [(ngModel)]="drawerForm.zoneUsage" name="zoneUsage">
                    @for (u of zoneUsages; track u) {
                      <mat-option [value]="u">{{ u }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">ZoneType</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.zoneType" name="zoneType" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">ABC Category</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.abcCategory" name="abcCategory" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">MixingStrategy</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.mixingStrategy" name="mixingStrategy" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">OperationMode</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="drawerForm.operationMode" name="operationMode" />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row drawer-row--checks">
              <mat-checkbox [(ngModel)]="drawerForm.isExternal" name="isExternal">External</mat-checkbox>
              <mat-checkbox [(ngModel)]="drawerForm.isActive" name="isActive">Active</mat-checkbox>
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
  styleUrl: './zone.component.css'
})
export class ZoneComponent {
  private readonly store = inject(ZoneStore);

  temperatureTypes = this.store.temperatureTypes;
  zoneUsages = this.store.zoneUsages;

  warehouses = this.store.warehouses;

  allZones = this.store.allZones;
  filteredZones = this.store.filteredZones;
  selectedZones = this.store.selectedZones;
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

  rowKey = (z: any) => this.store.rowKey(z);
  warehouseKey = (w: any) => this.store.warehouseKey(w);
  warehouseLabel = (id: any) => this.store.warehouseLabel(id);

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

