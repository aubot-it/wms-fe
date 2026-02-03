import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import './list.component.css';
import { InventoryListStore } from './list.store';
import { InventoryDetailComponent } from '../detail/inventory-detail.component';
import { InventoryActionComponent } from '../action/inventory-action.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    InventoryDetailComponent,
    InventoryActionComponent
  ],
  providers: [InventoryListStore],
  template: `
    <div class="inventory-container">
      <div class="inventory-header">
        <h1 class="inventory-title">Danh sách Tồn kho</h1>
      </div>

      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Từ khóa</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Keyword..." [(ngModel)]="store.filters.keyword" (input)="store.applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Owner</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="store.filters.ownerId" (selectionChange)="store.applyFilters()">
                <mat-option [value]="null">Tất cả</mat-option>
                @for (o of store.owners(); track store.ownerKey(o)) {
                  <mat-option [value]="o.ownerId ?? null">{{ o.ownerCode }} - {{ o.ownerName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Mã SKU</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="SKU..." [(ngModel)]="store.filters.skuCode" (input)="store.applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Từ ngày</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput type="datetime-local" [(ngModel)]="store.filters.fromDate" (change)="store.applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Đến ngày</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput type="datetime-local" [(ngModel)]="store.filters.toDate" (change)="store.applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-select [(ngModel)]="store.filters.status" (selectionChange)="store.applyFilters()">
                <mat-option value="">Tất cả</mat-option>
                @for (s of store.statusOptions; track s) {
                  <mat-option [value]="s">{{ s }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="filter-group button-group">
            <button mat-stroked-button class="btn btn-clear" (click)="store.clearFilters()">
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
                <mat-select [ngModel]="store.pageSize()" (ngModelChange)="store.onPageSizeChange($event)">
                  <mat-option [value]="10">10</mat-option>
                  <mat-option [value]="20">20</mat-option>
                  <mat-option [value]="50">50</mat-option>
                </mat-select>
              </mat-form-field>
              <span class="page-size-text">per page</span>
            </div>
            <div class="table-info">
              <span>Tổng số: <strong>{{ store.totalItems() }}</strong></span>
            </div>
          </div>
        </div>

        @if (store.isLoading()) {
          <div class="notice notice--info">Đang tải danh sách tồn kho...</div>
        }
        @if (store.errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ store.errorMessage() }}</div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="store.allItems()" class="inventory-table">
            <ng-container matColumnDef="inventoryId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let row"><strong>{{ row.inventoryId ?? '-' }}</strong></td>
            </ng-container>
            <ng-container matColumnDef="skuCode">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let row"><strong>{{ row.skuCode }}</strong></td>
            </ng-container>
            <ng-container matColumnDef="ownerId">
              <th mat-header-cell *matHeaderCellDef>Owner</th>
              <td mat-cell *matCellDef="let row">{{ row.ownerId != null ? store.ownerLabel(row.ownerId) : '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="onHandQty">
              <th mat-header-cell *matHeaderCellDef>On Hand</th>
              <td mat-cell *matCellDef="let row">{{ row.onHandQty ?? 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="availableQty">
              <th mat-header-cell *matHeaderCellDef>Available</th>
              <td mat-cell *matCellDef="let row">{{ row.availableQty ?? 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="reservedQty">
              <th mat-header-cell *matHeaderCellDef>Reserved</th>
              <td mat-cell *matCellDef="let row">{{ row.reservedQty ?? 0 }}</td>
            </ng-container>
            <ng-container matColumnDef="expiryDate">
              <th mat-header-cell *matHeaderCellDef>Expiry</th>
              <td mat-cell *matCellDef="let row">{{ row.expiryDate ? (row.expiryDate | date:'short') : '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="inventoryStatus">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">{{ row.inventoryStatus ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-col">Action</th>
              <td mat-cell *matCellDef="let row" class="actions-col">
                <button mat-stroked-button class="btn btn-clear btn-detail" type="button" (click)="store.openDetail(row)" aria-label="Chi tiết">
                  <mat-icon>open_in_new</mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="9" class="empty-state">
                <div class="empty-message">
                  <mat-icon>inventory_2</mat-icon>
                  <p>Không tìm thấy bản ghi tồn kho nào</p>
                </div>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="store.displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: store.displayedColumns"></tr>
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="store.allItems().length > 0"></tr>
          </table>
        </div>

        <div class="table-footer">
          <div class="footer-info">
            <span>
              Hiển thị <strong>{{ store.fromIndex() }}</strong> - <strong>{{ store.toIndex() }}</strong> / <strong>{{ store.totalItems() }}</strong>
            </span>
          </div>
          <div class="footer-pages">
            <button mat-icon-button class="page-btn" (click)="store.prevPage()" [disabled]="store.page() === 1 || store.isLoading()">
              <mat-icon>chevron_left</mat-icon>
            </button>
            @for (p of store.pages(); track p) {
              <button
                mat-mini-fab
                class="page-number"
                [class.page-number--active]="p === store.page()"
                (click)="store.goToPage(p)"
                [disabled]="store.isLoading()"
              >
                {{ p }}
              </button>
            }
            <button mat-icon-button class="page-btn" (click)="store.nextPage()" [disabled]="store.isLastPage() || store.isLoading()">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      </div>

    </div>

    <app-inventory-detail [store]="store" />
    <app-inventory-action [store]="store" />
  `,
  styleUrl: './list.component.css'
})
export class InventoryListComponent {
  readonly store = inject(InventoryListStore);
}
