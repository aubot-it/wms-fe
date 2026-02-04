import { Injectable, signal } from '@angular/core';
import { WarehouseDTO } from '../../../api/wcs.models';
import { WarehouseTableStore } from './warehouse.table.store';

export type WarehouseDrawerMode = 'create' | 'edit';
export type WarehouseDrawerForm = { warehouseCode: string; warehouseName: string; ownerId: string; ownerGroupId: string };

@Injectable()
export class WarehouseDrawerStore {
  drawerOpen = signal<boolean>(false);
  drawerMode = signal<WarehouseDrawerMode>('create');

  drawerForm: WarehouseDrawerForm = {
    warehouseCode: '',
    warehouseName: '',
    ownerId: '',
    ownerGroupId: ''
  };

  private editingWarehouse: WarehouseDTO | null = null;

  openCreate(): void {
    this.drawerMode.set('create');
    this.drawerForm = { warehouseCode: '', warehouseName: '', ownerId: '', ownerGroupId: '' };
    this.editingWarehouse = null;
    this.drawerOpen.set(true);
  }

  openEdit(table: WarehouseTableStore): void {
    const selected = table.selectedWarehouses();
    if (selected.length !== 1) return;

    const warehouse = table.allWarehouses().find((w) => table.rowKey(w) === selected[0]);
    if (!warehouse) return;

    this.drawerMode.set('edit');
    this.editingWarehouse = warehouse;
    this.drawerForm = {
      warehouseCode: warehouse.warehouseCode,
      warehouseName: warehouse.warehouseName,
      ownerId: warehouse.ownerId != null ? String(warehouse.ownerId) : '',
      ownerGroupId: warehouse.ownerGroupId != null ? String(warehouse.ownerGroupId) : ''
    };
    this.drawerOpen.set(true);
  }

  close(): void {
    this.drawerOpen.set(false);
    this.editingWarehouse = null;
  }

  buildPayload(): { ok: true; payload: WarehouseDTO } | { ok: false; message: string } {
    const code = (this.drawerForm.warehouseCode || '').trim();
    const name = (this.drawerForm.warehouseName || '').trim();
    const ownerId = (this.drawerForm.ownerId || '').trim();
    const ownerGroupId = (this.drawerForm.ownerGroupId || '').trim();

    if (!code || !name || !ownerId) {
      return { ok: false, message: 'Vui lòng nhập đầy đủ các trường bắt buộc' };
    }

    const ownerIdNum = Number(ownerId);
    if (!Number.isFinite(ownerIdNum)) {
      return { ok: false, message: 'OwnerId phải là số hợp lệ' };
    }

    const ownerGroupIdNum = ownerGroupId ? Number(ownerGroupId) : undefined;
    if (ownerGroupId && !Number.isFinite(ownerGroupIdNum!)) {
      return { ok: false, message: 'OwnerGroupId phải là số hợp lệ' };
    }

    const payload: WarehouseDTO = {
      warehouseCode: code,
      warehouseName: name,
      ownerId: ownerIdNum,
      ownerGroupId: ownerGroupIdNum
    };

    if (this.drawerMode() === 'edit' && this.editingWarehouse?.warehouseId != null) {
      payload.warehouseId = this.editingWarehouse.warehouseId;
    }

    return { ok: true, payload };
  }
}


