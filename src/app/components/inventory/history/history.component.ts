import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import './history.component.css';
import { InventoryHistoryStore } from './history.store';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  providers: [InventoryHistoryStore],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h1 class="history-title">Lịch sử Tồn kho</h1>
      </div>

      <div class="filter-section">
        <div class="filter-row">
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
            <label class="filter-label">Mã SKU</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="SKU..." [(ngModel)]="store.filters.skuCode" (input)="store.applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group">
            <label class="filter-label">Từ khóa</label>
            <mat-form-field appearance="outline" class="filter-field">
              <input matInput placeholder="Keyword..." [(ngModel)]="store.filters.keyword" (input)="store.applyFilters()" />
            </mat-form-field>
          </div>
          <div class="filter-group button-group">
            <button mat-stroked-button class="btn btn-clear" (click)="store.clearFilters()">
              <mat-icon>refresh</mat-icon>
              <span>Xóa bộ lọc</span>
            </button>
            <button mat-raised-button class="btn btn-primary" (click)="store.applyFilters()" [disabled]="store.isLoading()">
              <mat-icon>search</mat-icon>
              <span>Lọc</span>
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
          <div class="notice notice--info">Đang tải lịch sử...</div>
        }
        @if (store.errorMessage()) {
          <div class="notice notice--error">
            <div><strong>Không tải được dữ liệu.</strong></div>
            <div class="notice__sub">{{ store.errorMessage() }}</div>
          </div>
        }

        <div class="table-wrapper">
          <table mat-table [dataSource]="store.items()" class="history-table">
            <ng-container matColumnDef="createdDate">
              <th mat-header-cell *matHeaderCellDef>Thời gian</th>
              <td mat-cell *matCellDef="let row">{{ row.createdDate ? (row.createdDate | date:'short') : '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="actionType">
              <th mat-header-cell *matHeaderCellDef>Loại thao tác</th>
              <td mat-cell *matCellDef="let row">{{ store.actionTypeLabel(row.actionType) }}</td>
            </ng-container>
            <ng-container matColumnDef="inventoryId">
              <th mat-header-cell *matHeaderCellDef>Inventory ID</th>
              <td mat-cell *matCellDef="let row">{{ row.inventoryId ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="skuCode">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let row">{{ row.skuCode ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="locationId">
              <th mat-header-cell *matHeaderCellDef>Location</th>
              <td mat-cell *matCellDef="let row">{{ row.locationId ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="quantityChange">
              <th mat-header-cell *matHeaderCellDef>Thay đổi SL</th>
              <td mat-cell *matCellDef="let row">
                @if (row.quantityChange != null) {
                  <span [class.qty-positive]="row.quantityChange > 0" [class.qty-negative]="row.quantityChange < 0">
                    {{ row.quantityChange > 0 ? '+' : '' }}{{ row.quantityChange }}
                  </span>
                } @else if (row.oldQuantity != null && row.newQuantity != null) {
                  {{ row.oldQuantity }} → {{ row.newQuantity }}
                } @else {
                  -
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="reason">
              <th mat-header-cell *matHeaderCellDef>Lý do / Ghi chú</th>
              <td mat-cell *matCellDef="let row">{{ row.reason ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="createdBy">
              <th mat-header-cell *matHeaderCellDef>Người thực hiện</th>
              <td mat-cell *matCellDef="let row">{{ row.createdBy ?? '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="noData">
              <td mat-footer-cell *matFooterCellDef colspan="8" class="empty-state">
                <div class="empty-message">
                  <mat-icon>history</mat-icon>
                  <p>Không có bản ghi lịch sử trong khoảng thời gian đã chọn</p>
                </div>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="store.displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: store.displayedColumns"></tr>
            <tr mat-footer-row *matFooterRowDef="['noData']" [hidden]="store.items().length > 0"></tr>
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
  `,
  styleUrl: './history.component.css'
})
export class InventoryHistoryComponent {
  readonly store = inject(InventoryHistoryStore);
}
