import { Injectable, signal } from '@angular/core';
import { BrandDTO } from '../../../api/wcs.models';
import { BrandTableStore } from './brand.table.store';

export type BrandDrawerMode = 'create' | 'edit';

export interface BrandDrawerForm {
  brandCode: string;
  brandName: string;
  country: string;
  manufacturer: string;
  status: string;
  isActive: boolean;
}

@Injectable()
export class BrandDrawerStore {
  drawerOpen = signal<boolean>(false);
  drawerMode = signal<BrandDrawerMode>('create');

  drawerForm: BrandDrawerForm = {
    brandCode: '',
    brandName: '',
    country: '',
    manufacturer: '',
    status: '',
    isActive: true
  };

  private editingBrand: BrandDTO | null = null;

  openCreate(): void {
    this.drawerMode.set('create');
    this.drawerForm = {
      brandCode: '',
      brandName: '',
      country: '',
      manufacturer: '',
      status: '',
      isActive: true
    };
    this.editingBrand = null;
    this.drawerOpen.set(true);
  }

  openEdit(table: BrandTableStore): void {
    const selected = table.selectedBrands();
    if (selected.length !== 1) return;

    const brand = table.allBrands().find((b) => table.rowKey(b) === selected[0]);
    if (!brand) return;

    this.drawerMode.set('edit');
    this.editingBrand = brand;
    this.drawerForm = {
      brandCode: brand.brandCode ?? '',
      brandName: brand.brandName ?? '',
      country: brand.country ?? '',
      manufacturer: brand.manufacturer ?? '',
      status: brand.status ?? '',
      isActive: brand.isActive == null ? true : Boolean(brand.isActive)
    };
    this.drawerOpen.set(true);
  }

  close(): void {
    this.drawerOpen.set(false);
    this.editingBrand = null;
  }

  buildPayload(): { ok: true; payload: BrandDTO } | { ok: false; message: string } {
    const brandCode = (this.drawerForm.brandCode || '').trim();
    const brandName = (this.drawerForm.brandName || '').trim();

    if (!brandCode || !brandName) {
      return { ok: false, message: 'Vui lòng nhập đầy đủ: Mã Brand, Tên Brand' };
    }

    const payload: BrandDTO = {
      brandCode,
      brandName
    };

    if (this.drawerForm.country?.trim()) payload.country = this.drawerForm.country.trim();
    if (this.drawerForm.manufacturer?.trim()) payload.manufacturer = this.drawerForm.manufacturer.trim();
    if (this.drawerForm.status?.trim()) payload.status = this.drawerForm.status.trim();
    payload.isActive = this.drawerForm.isActive;

    if (this.drawerMode() === 'edit' && this.editingBrand?.brandId != null) {
      payload.brandId = this.editingBrand.brandId;
    }

    return { ok: true, payload };
  }
}

