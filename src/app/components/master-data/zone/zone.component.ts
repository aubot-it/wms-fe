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

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-col">Thao tác</th>
              <td mat-cell *matCellDef="let z" class="actions-col">
                <button
                  mat-stroked-button
                  class="btn btn-clear btn-detail"
                  type="button"
                  (click)="openDetail(z)"
                >
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </td>
            </ng-container>

            <!-- Empty State -->
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="9" class="empty-state">
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

    <!-- Floating detail dialog -->
    @if (detailOpen()) {
      <div class="zone-detail-backdrop" (click)="closeDetail()">
        <div class="zone-detail-modal" (click)="$event.stopPropagation()">
          <div class="zone-detail-modal__header">
            <div>
              <h2 class="zone-detail-modal__title">Chi tiết Zone</h2>
              <div class="zone-detail-modal__subtitle">
                {{ detailZone()?.zoneCode }} - {{ detailZone()?.zoneName }}
              </div>
            </div>
            <button mat-icon-button class="drawer-close" type="button" (click)="closeDetail()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="zone-detail-modal__body">
            <div class="zone-detail-grid">
              <!-- Location Types -->
              <div class="zone-detail-card">
                <div class="zone-detail-card__header">
                  <h2 class="zone-detail-card__title">Location Types</h2>
                </div>
                <div class="table-wrapper">
                  <table mat-table [dataSource]="locationTypes()" class="warehouse-table">
                    <ng-container matColumnDef="ltCode">
                      <th mat-header-cell *matHeaderCellDef>Code</th>
                      <td mat-cell *matCellDef="let lt"><strong>{{ lt.locationTypeCode }}</strong></td>
                    </ng-container>
                    <ng-container matColumnDef="ltName">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let lt">{{ lt.locationTypeName }}</td>
                    </ng-container>
                    <ng-container matColumnDef="ltActive">
                      <th mat-header-cell *matHeaderCellDef>Active</th>
                      <td mat-cell *matCellDef="let lt">
                        {{ lt.isActive == null ? '-' : (lt.isActive ? 'Yes' : 'No') }}
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['ltCode', 'ltName', 'ltActive']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['ltCode', 'ltName', 'ltActive']"></tr>
                  </table>
                </div>
              </div>

              <!-- Locations -->
              <div class="zone-detail-card">
                <div class="zone-detail-card__header">
                  <h2 class="zone-detail-card__title">Locations (vật lý)</h2>
                </div>

                <div class="zone-detail-filters">
                  <div class="filter-group">
                    <label class="filter-label">Location Type</label>
                    <mat-form-field appearance="outline" class="filter-field">
                      <mat-select
                        [(ngModel)]="locationFilters.locationTypeId"
                        (selectionChange)="reloadLocations()"
                      >
                        <mat-option [value]="null">Tất cả</mat-option>
                        @for (lt of locationTypes(); track lt.locationTypeID) {
                          <mat-option [value]="lt.locationTypeID ?? null">
                            {{ lt.locationTypeCode }} - {{ lt.locationTypeName }}
                          </mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>

                <div class="table-wrapper">
                  <table mat-table [dataSource]="locations()" class="warehouse-table">
                    <ng-container matColumnDef="locCode">
                      <th mat-header-cell *matHeaderCellDef>Code</th>
                      <td mat-cell *matCellDef="let l"><strong>{{ l.locationCode }}</strong></td>
                    </ng-container>
                    <ng-container matColumnDef="aisle">
                      <th mat-header-cell *matHeaderCellDef>Aisle</th>
                      <td mat-cell *matCellDef="let l">{{ l.aisle }}</td>
                    </ng-container>
                    <ng-container matColumnDef="bay">
                      <th mat-header-cell *matHeaderCellDef>Bay</th>
                      <td mat-cell *matCellDef="let l">{{ l.bay }}</td>
                    </ng-container>
                    <ng-container matColumnDef="layer">
                      <th mat-header-cell *matHeaderCellDef>Layer</th>
                      <td mat-cell *matCellDef="let l">{{ l.layer }}</td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="['locCode', 'aisle', 'bay', 'layer']"></tr>
                    <tr mat-row *matRowDef="let row; columns: ['locCode', 'aisle', 'bay', 'layer']"></tr>
                  </table>
                </div>
              </div>
            </div>

            <div class="zone-detail-modal__footer">
              <button
                mat-stroked-button
                type="button"
                class="btn btn-clear"
                (click)="openLocationTypeDrawer()"
              >
                <mat-icon>add</mat-icon>
                <span>Tạo LocationType</span>
              </button>
              <button
                mat-raised-button
                color="primary"
                type="button"
                class="btn btn-primary"
                (click)="createLocation()"
              >
                <mat-icon>add_location</mat-icon>
                <span>Tạo Location</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }

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

    @if (locationTypeDrawerOpen()) {
      <div class="drawer-backdrop" (click)="closeLocationTypeDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2 class="drawer-title">
              {{ locationTypeDrawerMode() === 'create' ? 'Thêm LocationType' : 'Cập nhật LocationType' }}
            </h2>
            <button mat-icon-button class="drawer-close" (click)="closeLocationTypeDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitLocationTypeDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">LocationTypeCode <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input
                  matInput
                  type="text"
                  required
                  [(ngModel)]="locationTypeDrawerForm.locationTypeCode"
                  name="locationTypeCode"
                />
              </mat-form-field>
            </div>

            <div class="drawer-field">
              <label class="drawer-label">LocationTypeName <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input
                  matInput
                  type="text"
                  required
                  [(ngModel)]="locationTypeDrawerForm.locationTypeName"
                  name="locationTypeName"
                />
              </mat-form-field>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Height (cm) <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.heightCm"
                    name="heightCm"
                  />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Width (cm) <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.widthCm"
                    name="widthCm"
                  />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Depth (cm) <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.depthCm"
                    name="depthCm"
                  />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Max Weight (kg) <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.maxWeightKg"
                    name="maxWeightKg"
                  />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Max Volume (m3) <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.maxVolumeM3"
                    name="maxVolumeM3"
                  />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Max Pallets <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.maxPallets"
                    name="maxPallets"
                  />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Max Layers <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="number"
                    required
                    [(ngModel)]="locationTypeDrawerForm.maxLayers"
                    name="maxLayers"
                  />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Shelf Type <span class="required">*</span></label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input
                    matInput
                    type="text"
                    required
                    [(ngModel)]="locationTypeDrawerForm.shelfType"
                    name="shelfType"
                  />
                </mat-form-field>
              </div>
            </div>

            <div class="drawer-row drawer-row--checks">
              <mat-checkbox
                [(ngModel)]="locationTypeDrawerForm.oneToManyConfig"
                name="oneToManyConfig"
              >
                One-to-Many Config
              </mat-checkbox>
              <mat-checkbox
                [(ngModel)]="locationTypeDrawerForm.isActive"
                name="ltIsActive"
              >
                Active
              </mat-checkbox>
            </div>

            <div class="drawer-actions">
              <button
                mat-stroked-button
                type="button"
                class="btn btn-clear"
                (click)="closeLocationTypeDrawer()"
              >
                Hủy
              </button>
              <button
                mat-raised-button
                type="submit"
                class="btn btn-primary"
                [disabled]="isLoading()"
              >
                {{ locationTypeDrawerMode() === 'create' ? 'Lưu' : 'Cập nhật' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (locationDrawerOpen()) {
      <div class="drawer-backdrop" (click)="closeLocationDrawer()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2 class="drawer-title">Thêm Location</h2>
            <button mat-icon-button class="drawer-close" (click)="closeLocationDrawer()">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form class="drawer-form" (ngSubmit)="submitLocationDrawer()">
            <div class="drawer-field">
              <label class="drawer-label">Zone</label>
              <p class="drawer-readonly">{{ detailZone()?.zoneCode }} - {{ detailZone()?.zoneName }}</p>
            </div>
            <div class="drawer-field">
              <label class="drawer-label">LocationCode <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="text" required [(ngModel)]="locationDrawerForm.locationCode" name="locationCode" />
              </mat-form-field>
            </div>
            <div class="drawer-field">
              <label class="drawer-label">LocationType <span class="required">*</span></label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <mat-select required [(ngModel)]="locationDrawerForm.locationTypeId" name="locationTypeId">
                  <mat-option [value]="null">-- Chọn --</mat-option>
                  @for (lt of locationTypes(); track lt.locationTypeID) {
                    <mat-option [value]="lt.locationTypeID ?? null">{{ lt.locationTypeCode }} - {{ lt.locationTypeName }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Aisle</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="locationDrawerForm.aisle" name="aisle" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">ShelfGroup</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="locationDrawerForm.shelfGroup" name="shelfGroup" />
                </mat-form-field>
              </div>
            </div>
            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Depth</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="locationDrawerForm.depth" name="depth" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Side</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="text" [(ngModel)]="locationDrawerForm.side" name="side" />
                </mat-form-field>
              </div>
            </div>
            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">Layer</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="locationDrawerForm.layer" name="layer" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">Bay</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="locationDrawerForm.bay" name="bay" />
                </mat-form-field>
              </div>
            </div>
            <div class="drawer-row">
              <div class="drawer-field">
                <label class="drawer-label">PickPriority</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="locationDrawerForm.pickPriority" name="pickPriority" />
                </mat-form-field>
              </div>
              <div class="drawer-field">
                <label class="drawer-label">PutawayPriority</label>
                <mat-form-field appearance="outline" class="drawer-form-field-half">
                  <input matInput type="number" [(ngModel)]="locationDrawerForm.putawayPriority" name="putawayPriority" />
                </mat-form-field>
              </div>
            </div>
            <div class="drawer-field">
              <label class="drawer-label">Status</label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="text" [(ngModel)]="locationDrawerForm.status" name="status" />
              </mat-form-field>
            </div>
            <div class="drawer-row drawer-row--checks">
              <mat-checkbox [(ngModel)]="locationDrawerForm.isLocked" name="isLocked">IsLocked</mat-checkbox>
            </div>
            <div class="drawer-actions">
              <button mat-stroked-button type="button" class="btn btn-clear" (click)="closeLocationDrawer()">Hủy</button>
              <button mat-raised-button type="submit" class="btn btn-primary" [disabled]="isLoading()">Lưu</button>
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

  // Detail: LocationTypes & Locations
  locationTypes = this.store.locationTypes;
  locations = this.store.locations;
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
  detailOpen = this.store.detailOpen;
  detailZone = this.store.detailZone;

  // LocationType drawer
  locationTypeDrawerOpen = this.store.locationTypeDrawerOpen;
  locationTypeDrawerMode = this.store.locationTypeDrawerMode;
  get locationTypeDrawerForm() {
    return this.store.locationTypeDrawerForm;
  }
  set locationTypeDrawerForm(v: any) {
    this.store.locationTypeDrawerForm = v;
  }

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

  openDetail(zone: any): void {
    this.store.openDetail(zone);
  }

  closeDetail(): void {
    this.store.closeDetail();
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

  // Detail filters / actions
  get locationFilters() {
    return this.store.locationFilters;
  }
  set locationFilters(v: any) {
    this.store.locationFilters = v;
  }

  reloadLocations(): void {
    this.store.reloadLocations();
  }

  openLocationTypeDrawer(): void {
    this.store.createLocationType();
  }

  closeLocationTypeDrawer(): void {
    this.store.closeLocationTypeDrawer();
  }

  submitLocationTypeDrawer(): void {
    this.store.submitLocationTypeDrawer();
  }

  createLocation(): void {
    this.store.openLocationDrawer();
  }

  locationDrawerOpen = this.store.locationDrawerOpen;
  get locationDrawerForm() {
    return this.store.locationDrawerForm;
  }
  set locationDrawerForm(v: typeof this.store.locationDrawerForm) {
    this.store.locationDrawerForm = v;
  }

  closeLocationDrawer(): void {
    this.store.closeLocationDrawer();
  }

  submitLocationDrawer(): void {
    this.store.submitLocationDrawer();
  }
}

