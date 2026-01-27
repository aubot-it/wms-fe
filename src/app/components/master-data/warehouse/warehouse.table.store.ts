import { Injectable, signal } from '@angular/core';
import { WarehouseDTO } from '../../../api/wcs.models';

@Injectable()
export class WarehouseTableStore {
  allWarehouses = signal<WarehouseDTO[]>([]);
  filteredWarehouses = signal<WarehouseDTO[]>([]);
  selectedWarehouses = signal<string[]>([]);

  page = signal<number>(1);
  pageSize = signal<number>(20);
  isLastPage = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  displayedColumns: string[] = ['select', 'warehouseId', 'warehouseCode', 'warehouseName', 'ownerId', 'ownerGroupId'];

  filters: { name: string; code: string; status: string; type: string; keyword: string } = {
    name: '',
    code: '',
    status: '',
    type: '',
    keyword: ''
  };

  rowKey(w: WarehouseDTO): string {
    return w.warehouseId != null ? String(w.warehouseId) : w.warehouseCode;
  }

  applyClientFilters(): void {
    let filtered = [...this.allWarehouses()];

    if (this.filters.name) {
      filtered = filtered.filter((w) =>
        (w.warehouseName || '').toLowerCase().includes(this.filters.name.toLowerCase())
      );
    }

    if (this.filters.code) {
      filtered = filtered.filter((w) =>
        (w.warehouseCode || '').toLowerCase().includes(this.filters.code.toLowerCase())
      );
    }

    this.filteredWarehouses.set(filtered);
  }

  resetFilters(): void {
    this.filters = { name: '', code: '', status: '', type: '', keyword: '' };
  }

  // ---------- selection ----------
  toggleSelect(id: string): void {
    const selected = this.selectedWarehouses();
    if (selected.includes(id)) {
      this.selectedWarehouses.set(selected.filter((s) => s !== id));
    } else {
      this.selectedWarehouses.set([...selected, id]);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.checked;
    if (checked) {
      this.selectedWarehouses.set(this.filteredWarehouses().map((w) => this.rowKey(w)));
    } else {
      this.selectedWarehouses.set([]);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedWarehouses().includes(id);
  }

  isSomeSelected(): boolean {
    const filtered = this.filteredWarehouses();
    const selectedCount = filtered.filter((w) => this.isSelected(this.rowKey(w))).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  isAllSelected(): boolean {
    const filtered = this.filteredWarehouses();
    return filtered.length > 0 && filtered.every((w) => this.isSelected(this.rowKey(w)));
  }

  // ---------- pagination helpers ----------
  fromIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    return Math.min(this.totalItems(), (this.page() - 1) * this.pageSize() + this.filteredWarehouses().length);
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}


