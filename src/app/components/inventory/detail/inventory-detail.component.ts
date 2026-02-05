import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import './inventory-detail.component.css';
import { InventoryListStore } from '../list/list.store';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    @if (store.detailOpen() && store.detailInventory(); as inv) {
      <div class="inventory-detail-backdrop" (click)="store.closeDetail()">
        <div class="inventory-detail-panel" (click)="$event.stopPropagation()">
          <div class="inventory-detail-header">
            <h2 class="inventory-detail-title">Chi tiết tồn kho</h2>
            <button mat-icon-button type="button" class="drawer-close" (click)="store.closeDetail()" aria-label="Đóng">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <div class="inventory-detail-attrs">
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Inventory ID</span>
              <span class="inventory-detail-attr__value">{{ inv.inventoryId ?? '-' }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">SKU</span>
              <span class="inventory-detail-attr__value">{{ inv.skuCode }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Chủ sở hữu</span>
              <span class="inventory-detail-attr__value">{{ inv.ownerId != null ? store.ownerLabel(inv.ownerId) : '-' }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Location ID</span>
              <span class="inventory-detail-attr__value">{{ inv.locationId ?? '-' }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Tồn thực tế</span>
              <span class="inventory-detail-attr__value">{{ inv.onHandQty ?? 0 }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Khả dụng</span>
              <span class="inventory-detail-attr__value">{{ inv.availableQty ?? 0 }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Đã giữ</span>
              <span class="inventory-detail-attr__value">{{ inv.reservedQty ?? 0 }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Lot No</span>
              <span class="inventory-detail-attr__value">{{ inv.lotNo ?? '-' }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Hạn sử dụng</span>
              <span class="inventory-detail-attr__value">{{ inv.expiryDate ? (inv.expiryDate | date:'short') : '-' }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Trạng thái</span>
              <span class="inventory-detail-attr__value">{{ inv.inventoryStatus ?? '-' }}</span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Ngày tạo</span>
              <span class="inventory-detail-attr__value">
                {{ inv.createdDate ? (inv.createdDate | date:'short') : '-' }} {{ inv.createdBy ? ' · ' + inv.createdBy : '' }}
              </span>
            </div>
            <div class="inventory-detail-attr">
              <span class="inventory-detail-attr__label">Đã cập nhật</span>
              <span class="inventory-detail-attr__value">
                {{ inv.updatedDate ? (inv.updatedDate | date:'short') : '-' }} {{ inv.updatedBy ? ' · ' + inv.updatedBy : '' }}
              </span>
            </div>
          </div>

          <div class="inventory-detail-actions">
            <button mat-stroked-button type="button" class="btn btn-clear" (click)="store.openActionDialog(inv, 'adjust')">Chỉnh sửa</button>
            <button mat-stroked-button type="button" class="btn btn-clear" (click)="store.openActionDialog(inv, 'reserve')">Reserve</button>
            <button mat-stroked-button type="button" class="btn btn-clear" (click)="store.openActionDialog(inv, 'hold')">Hold</button>
            <button mat-stroked-button type="button" class="btn btn-clear" (click)="store.openActionDialog(inv, 'release')">Release</button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './inventory-detail.component.css'
})
export class InventoryDetailComponent {
  @Input({ required: true }) store!: InventoryListStore;
}

