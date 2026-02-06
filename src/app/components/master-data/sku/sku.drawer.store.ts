import { Injectable, signal } from '@angular/core';
import { SkuDTO } from '../../../api/wcs.models';
import { SkuTableStore } from './sku.table.store';
import { TemperatureType } from '../../../api/wcs.models';

export type SkuDrawerMode = 'create' | 'edit';

export interface SkuDrawerForm {
  skuCode: string;
  skuName: string;
  baseUom: string;
  ownerId: string;
  brandId: string;
  temperatureType: TemperatureType | '';
  caseUom: string;
  palletUom: string;
  caseQty: string;
  palletQty: string;
  isBatchControl: boolean;
  isExpiryControl: boolean;
  isSerialControl: boolean;
  velocityClass: string;
  defaultWeightKg: string;
  defaultVolumeM3: string;
  status: string;
  isActive: boolean;
}

@Injectable()
export class SkuDrawerStore {
  drawerOpen = signal<boolean>(false);
  drawerMode = signal<SkuDrawerMode>('create');

  drawerForm: SkuDrawerForm = {
    skuCode: '',
    skuName: '',
    baseUom: '',
    ownerId: '',
    brandId: '',
    temperatureType: 'NORMAL',
    caseUom: '',
    palletUom: '',
    caseQty: '',
    palletQty: '',
    isBatchControl: false,
    isExpiryControl: false,
    isSerialControl: false,
    velocityClass: '',
    defaultWeightKg: '',
    defaultVolumeM3: '',
    status: '',
    isActive: true
  };

  private editingSku: SkuDTO | null = null;

  openCreate(): void {
    this.drawerMode.set('create');
    this.drawerForm = {
      skuCode: '',
      skuName: '',
      baseUom: '',
      ownerId: '',
      brandId: '',
      temperatureType: 'NORMAL',
      caseUom: '',
      palletUom: '',
      caseQty: '',
      palletQty: '',
      isBatchControl: false,
      isExpiryControl: false,
      isSerialControl: false,
      velocityClass: '',
      defaultWeightKg: '',
      defaultVolumeM3: '',
      status: '',
      isActive: true
    };
    this.editingSku = null;
    this.drawerOpen.set(true);
  }

  openEdit(table: SkuTableStore): void {
    const selected = table.selectedSkus();
    if (selected.length !== 1) return;

    const sku = table.allSkus().find((s) => table.rowKey(s) === selected[0]);
    if (!sku) return;

    this.drawerMode.set('edit');
    this.editingSku = sku;
    this.drawerForm = {
      skuCode: sku.skuCode ?? '',
      skuName: sku.skuName ?? '',
      baseUom: sku.baseUom ?? '',
      ownerId: sku.ownerId != null ? String(sku.ownerId) : '',
      brandId: sku.brandId != null ? String(sku.brandId) : '',
      temperatureType: (sku.temperatureType as TemperatureType) ?? 'NORMAL',
      caseUom: sku.caseUom ?? '',
      palletUom: sku.palletUom ?? '',
      caseQty: sku.caseQty != null ? String(sku.caseQty) : '',
      palletQty: sku.palletQty != null ? String(sku.palletQty) : '',
      isBatchControl: Boolean(sku.isBatchControl),
      isExpiryControl: Boolean(sku.isExpiryControl),
      isSerialControl: Boolean(sku.isSerialControl),
      velocityClass: sku.velocityClass ?? '',
      defaultWeightKg: sku.defaultWeightKg != null ? String(sku.defaultWeightKg) : '',
      defaultVolumeM3: sku.defaultVolumeM3 != null ? String(sku.defaultVolumeM3) : '',
      status: sku.status ?? '',
      isActive: sku.isActive == null ? true : Boolean(sku.isActive)
    };
    this.drawerOpen.set(true);
  }

  close(): void {
    this.drawerOpen.set(false);
    this.editingSku = null;
  }

  buildPayload(): { ok: true; payload: SkuDTO } | { ok: false; message: string } {
    const skuCode = (this.drawerForm.skuCode || '').trim();
    const skuName = (this.drawerForm.skuName || '').trim();
    const baseUom = (this.drawerForm.baseUom || '').trim();
    const ownerId = (this.drawerForm.ownerId || '').trim();
    const brandId = (this.drawerForm.brandId || '').trim();
    const temperatureType = this.drawerForm.temperatureType || 'NORMAL';

    if (!skuCode || !skuName || !baseUom || !ownerId || !brandId) {
      return { ok: false, message: 'Vui lòng nhập đầy đủ: Mã SKU, Tên SKU, Base UOM, Owner ID, Brand ID' };
    }

    const ownerIdNum = Number(ownerId);
    const brandIdNum = Number(brandId);
    if (!Number.isFinite(ownerIdNum)) {
      return { ok: false, message: 'Owner ID phải là số hợp lệ' };
    }
    if (!Number.isFinite(brandIdNum)) {
      return { ok: false, message: 'Brand ID phải là số hợp lệ' };
    }

    const payload: SkuDTO = {
      skuCode,
      skuName,
      baseUom,
      ownerId: ownerIdNum,
      brandId: brandIdNum,
      temperatureType: temperatureType as 'NORMAL' | 'COLD' | 'FROZEN'
    };

    if (this.drawerForm.caseUom?.trim()) payload.caseUom = this.drawerForm.caseUom.trim();
    if (this.drawerForm.palletUom?.trim()) payload.palletUom = this.drawerForm.palletUom.trim();
    const caseQty = this.drawerForm.caseQty?.trim();
    if (caseQty && Number.isFinite(Number(caseQty))) payload.caseQty = Number(caseQty);
    const palletQty = this.drawerForm.palletQty?.trim();
    if (palletQty && Number.isFinite(Number(palletQty))) payload.palletQty = Number(palletQty);
    payload.isBatchControl = this.drawerForm.isBatchControl;
    payload.isExpiryControl = this.drawerForm.isExpiryControl;
    payload.isSerialControl = this.drawerForm.isSerialControl;
    if (this.drawerForm.velocityClass?.trim()) payload.velocityClass = this.drawerForm.velocityClass.trim();
    const defaultWeightKg = this.drawerForm.defaultWeightKg?.trim();
    if (defaultWeightKg && Number.isFinite(Number(defaultWeightKg)))
      payload.defaultWeightKg = Number(defaultWeightKg);
    const defaultVolumeM3 = this.drawerForm.defaultVolumeM3?.trim();
    if (defaultVolumeM3 && Number.isFinite(Number(defaultVolumeM3)))
      payload.defaultVolumeM3 = Number(defaultVolumeM3);
    if (this.drawerForm.status?.trim()) payload.status = this.drawerForm.status.trim();
    payload.isActive = this.drawerForm.isActive;

    if (this.drawerMode() === 'edit' && this.editingSku?.skuID != null) {
      payload.skuID = this.editingSku.skuID;
    }

    return { ok: true, payload };
  }
}
