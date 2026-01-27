import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import './zone.component.css';
import { WcsZoneApi } from '../../../api/wcs-zone.api';
import { WcsWarehouseApi } from '../../../api/wcs-warehouse.api';
import { TemperatureControlType, WarehouseDTO, ZoneDTO, ZoneUsage } from '../../../api/wcs.models';

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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly api = inject(WcsZoneApi);
  private readonly warehouseApi = inject(WcsWarehouseApi);

  temperatureTypes: TemperatureControlType[] = ['NORMAL', 'COLD', 'FROZEN'];
  zoneUsages: ZoneUsage[] = ['INBOUND', 'OUTBOUND', 'BOTH'];

  warehouses = signal<WarehouseDTO[]>([]);

  allZones = signal<ZoneDTO[]>([]);
  filteredZones = signal<ZoneDTO[]>([]);
  selectedZones = signal<string[]>([]);
  page = signal<number>(1);
  pageSize = signal<number>(20);
  isLastPage = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  drawerOpen = signal<boolean>(false);
  drawerMode = signal<'create' | 'edit'>('create');
  drawerForm: {
    warehouseId: number | null;
    zoneCode: string;
    zoneName: string;
    temperatureControlType: TemperatureControlType;
    zoneUsage: ZoneUsage;
    zoneType: string;
    abcCategory: string;
    mixingStrategy: string;
    operationMode: string;
    isExternal: boolean;
    isActive: boolean;
  } = {
    warehouseId: null,
    zoneCode: '',
    zoneName: '',
    temperatureControlType: 'NORMAL',
    zoneUsage: 'BOTH',
    zoneType: '',
    abcCategory: '',
    mixingStrategy: '',
    operationMode: '',
    isExternal: false,
    isActive: true
  };
  private editingZone: ZoneDTO | null = null;

  displayedColumns: string[] = [
    'select',
    'zoneID',
    'zoneCode',
    'zoneName',
    'warehouse',
    'temperatureControlType',
    'zoneUsage',
    'isActive'
  ];

  filters: {
    keyword: string;
    warehouseId: number | null;
    temperatureControlType: '' | TemperatureControlType;
    zoneUsage: '' | ZoneUsage;
    code: string;
    name: string;
  } = {
    keyword: '',
    warehouseId: null,
    temperatureControlType: '',
    zoneUsage: '',
    code: '',
    name: ''
  };

  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor() {
    // SSR-safe: only call backend from browser
    if (isPlatformBrowser(this.platformId)) {
      this.reloadWarehouses();
      this.reloadFromApi();
    }
  }

  applyFilters(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  applyClientFilters(): void {
    let filtered = [...this.allZones()];

    if (this.filters.code) {
      filtered = filtered.filter((z) => (z.zoneCode || '').toLowerCase().includes(this.filters.code.toLowerCase()));
    }
    if (this.filters.name) {
      filtered = filtered.filter((z) => (z.zoneName || '').toLowerCase().includes(this.filters.name.toLowerCase()));
    }

    this.filteredZones.set(filtered);
  }

  clearFilters(): void {
    this.filters = {
      keyword: '',
      warehouseId: null,
      temperatureControlType: '',
      zoneUsage: '',
      code: '',
      name: ''
    };
    if (!isPlatformBrowser(this.platformId)) return;
    this.page.set(1);
    this.reloadFromApi();
  }

  toggleSelect(id: string): void {
    const selected = this.selectedZones();
    if (selected.includes(id)) {
      this.selectedZones.set(selected.filter((s) => s !== id));
    } else {
      this.selectedZones.set([...selected, id]);
    }
  }

  toggleSelectAll(event: { checked: boolean }): void {
    const checked = event.checked;
    if (checked) {
      this.selectedZones.set(this.filteredZones().map((z) => this.rowKey(z)));
    } else {
      this.selectedZones.set([]);
    }
  }

  isSomeSelected(): boolean {
    const filtered = this.filteredZones();
    const selectedCount = filtered.filter((z) => this.isSelected(this.rowKey(z))).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  isSelected(id: string): boolean {
    return this.selectedZones().includes(id);
  }

  isAllSelected(): boolean {
    const filtered = this.filteredZones();
    return filtered.length > 0 && filtered.every((z) => this.isSelected(this.rowKey(z)));
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
    if (!Number.isFinite(v) || v <= 0) return;
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
    const selected = this.selectedZones();
    if (selected.length === 0) return;

    if (confirm(`Bạn có chắc chắn muốn xóa ${selected.length} zone đã chọn?`)) {
      const ids = selected.map((k) => Number(k)).filter((n) => Number.isFinite(n)) as number[];
      if (ids.length === 0) {
        alert('Không xác định được zoneID để xóa (API yêu cầu id dạng số).');
        return;
      }

      this.isLoading.set(true);
      let done = 0;
      ids.forEach((id) => {
        this.api.deleteZone(id).subscribe({
          next: () => {
            done++;
            if (done === ids.length) {
              this.isLoading.set(false);
              this.reloadFromApi();
              alert(`Đã gửi yêu cầu xóa ${ids.length} zone (check backend response).`);
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

  openCreateDrawer(): void {
    this.drawerMode.set('create');
    this.drawerForm = {
      warehouseId: this.filters.warehouseId ?? null,
      zoneCode: '',
      zoneName: '',
      temperatureControlType: 'NORMAL',
      zoneUsage: 'BOTH',
      zoneType: '',
      abcCategory: '',
      mixingStrategy: '',
      operationMode: '',
      isExternal: false,
      isActive: true
    };
    this.editingZone = null;
    this.drawerOpen.set(true);
  }

  openEditDrawer(): void {
    const selected = this.selectedZones();
    if (selected.length !== 1) return;

    const zone = this.allZones().find((z) => this.rowKey(z) === selected[0]);
    if (!zone) return;

    this.drawerMode.set('edit');
    this.editingZone = zone;
    this.drawerForm = {
      warehouseId: zone.warehouseId ?? null,
      zoneCode: zone.zoneCode,
      zoneName: zone.zoneName,
      temperatureControlType: zone.temperatureControlType,
      zoneUsage: zone.zoneUsage,
      zoneType: (zone.zoneType ?? '') as string,
      abcCategory: (zone.abcCategory ?? '') as string,
      mixingStrategy: (zone.mixingStrategy ?? '') as string,
      operationMode: (zone.operationMode ?? '') as string,
      isExternal: Boolean(zone.isExternal),
      isActive: zone.isActive == null ? true : Boolean(zone.isActive)
    };
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editingZone = null;
  }

  submitDrawer(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const warehouseId = this.drawerForm.warehouseId;
    const zoneCode = (this.drawerForm.zoneCode || '').trim();
    const zoneName = (this.drawerForm.zoneName || '').trim();

    if (warehouseId == null || !Number.isFinite(warehouseId) || !zoneCode || !zoneName) {
      alert('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    const payload: ZoneDTO = {
      warehouseId,
      zoneCode,
      zoneName,
      temperatureControlType: this.drawerForm.temperatureControlType,
      zoneUsage: this.drawerForm.zoneUsage,
      zoneType: this.drawerForm.zoneType?.trim() || null,
      abcCategory: this.drawerForm.abcCategory?.trim() || null,
      mixingStrategy: this.drawerForm.mixingStrategy?.trim() || null,
      operationMode: this.drawerForm.operationMode?.trim() || null,
      isExternal: this.drawerForm.isExternal,
      isActive: this.drawerForm.isActive
    };

    this.isLoading.set(true);

    if (this.drawerMode() === 'create') {
      this.api.createZone(payload).subscribe({
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
      if (this.editingZone?.zoneID != null) {
        payload.zoneID = this.editingZone.zoneID;
      }
      this.api.updateZone(payload).subscribe({
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

  rowKey(z: ZoneDTO): string {
    return z.zoneID != null ? String(z.zoneID) : z.zoneCode;
  }

  warehouseKey(w: WarehouseDTO): string {
    return w.warehouseId != null ? String(w.warehouseId) : w.warehouseCode;
  }

  warehouseLabel(warehouseId: number): string {
    const w = this.warehouses().find((x) => x.warehouseId === warehouseId);
    return w ? `${w.warehouseCode} - ${w.warehouseName}` : String(warehouseId ?? '-');
  }

  fromIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredZones().length);
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  private reloadWarehouses(): void {
    this.warehouseApi.getWarehouseList({ page: 1, pageSize: 1000 }).subscribe({
      next: (result) => {
        this.warehouses.set(result.items ?? []);
      },
      error: () => {
        // keep silent - zones list can still load; user can filter by id manually
        this.warehouses.set([]);
      }
    });
  }

  private reloadFromApi(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api
      .getZoneList({
        keyword: (this.filters.keyword || '').trim(),
        warehouseId: this.filters.warehouseId ?? undefined,
        temperatureControlType: this.filters.temperatureControlType || undefined,
        zoneUsage: this.filters.zoneUsage || undefined,
        page: this.page(),
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (result) => {
          const list = result.items ?? [];
          const total = result.total ?? list.length;

          this.allZones.set(list);
          this.applyClientFilters();
          this.selectedZones.set([]);
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
          this.allZones.set([]);
          this.filteredZones.set([]);
          this.selectedZones.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.isLastPage.set(true);
        }
      });
  }
}

