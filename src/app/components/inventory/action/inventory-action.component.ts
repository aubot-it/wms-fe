import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import './inventory-action.component.css';
import { InventoryListStore } from '../list/list.store';

@Component({
  selector: 'app-inventory-action',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    @if (store.actionDialogOpen()) {
      <div class="drawer-backdrop" (click)="store.closeActionDialog()">
        <div class="drawer-panel inventory-action-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2 class="drawer-title">
              {{ store.actionType() === 'adjust' ? 'Điều chỉnh tồn' : store.actionType() === 'reserve' ? 'Reserve' : store.actionType() === 'hold' ? 'Hold' : 'Release' }}
            </h2>
            <button mat-icon-button class="drawer-close" type="button" (click)="store.closeActionDialog()">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          @if (store.selectedInventory(); as inv) {
            <div class="action-dialog-info">
              <p><strong>SKU:</strong> {{ inv.skuCode }} | <strong>Location:</strong> {{ inv.locationId ?? '-' }} | <strong>On Hand:</strong> {{ inv.onHandQty ?? 0 }}</p>
            </div>
          }

          <div class="drawer-form">
            <div class="drawer-field">
              <label class="drawer-label">
                {{ store.actionType() === 'adjust' ? 'Số lượng điều chỉnh (+ tăng, - giảm)' : 'Số lượng' }}
                <span class="required">*</span>
              </label>
              <mat-form-field appearance="outline" class="drawer-form-field">
                <input matInput type="number" [ngModel]="store.actionQty()" (ngModelChange)="store.setActionQty($event)" />
              </mat-form-field>
            </div>

            @if (store.actionType() === 'adjust') {
              <div class="drawer-field">
                <label class="drawer-label">Lý do</label>
                <mat-form-field appearance="outline" class="drawer-form-field">
                  <input matInput type="text" [ngModel]="store.actionReason()" (ngModelChange)="store.setActionReason($event)" placeholder="Tùy chọn" />
                </mat-form-field>
              </div>
            }

            <div class="drawer-actions">
              <button mat-stroked-button type="button" class="btn btn-clear" (click)="store.closeActionDialog()">Hủy</button>
              <button mat-raised-button type="button" class="btn btn-primary" (click)="store.submitAction()" [disabled]="store.isLoading()">Xác nhận</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './inventory-action.component.css'
})
export class InventoryActionComponent {
  @Input({ required: true }) store!: InventoryListStore;
}

