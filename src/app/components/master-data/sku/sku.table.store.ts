import { Injectable, signal } from '@angular/core';
import { SkuDTO } from '../../../api/wcs.models';

@Injectable()
export class SkuTableStore {
  allSkus = signal<SkuDTO[]>([]);
  filteredSkus = signal<SkuDTO[]>([]);
  selectedSkus = signal<string[]>([]);

  page = signal<number>(1);
  pageSize = signal<number>(20);
  isLastPage = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  displayedColumns: string[] = [
    'select',
    'skuID',
    'skuCode',
    'skuName',
    'temperatureType',
    'baseUom',
    'ownerId',
    'brandId',
    'isActive'
  ];

  filters: { name: string; code: string; keyword: string } = {
    name: '',
    code: '',
    keyword: ''
  };

  rowKey(s: SkuDTO): string {
    return s.skuID != null ? String(s.skuID) : s.skuCode;
  }

  applyClientFilters(): void {
    let filtered = [...this.allSkus()];

    if (this.filters.name) {
      filtered = filtered.filter((s) =>
        (s.skuName || '').toLowerCase().includes(this.filters.name.toLowerCase())
      );
    }

    if (this.filters.code) {
      filtered = filtered.filter((s) =>
        (s.skuCode || '').toLowerCase().includes(this.filters.code.toLowerCase())
      );
    }

    this.filteredSkus.set(filtered);
  }

  resetFilters(): void {
    this.filters = { name: '', code: '', keyword: '' };
  }

  toggleSelect(id: string): void {
    const selected = this.selectedSkus();
    if (selected.includes(id)) {
      this.selectedSkus.set(selected.filter((s) => s !== id));
    } else {
      this.selectedSkus.set([...selected, id]);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.checked;
    if (checked) {
      this.selectedSkus.set(this.filteredSkus().map((s) => this.rowKey(s)));
    } else {
      this.selectedSkus.set([]);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedSkus().includes(id);
  }

  isSomeSelected(): boolean {
    const filtered = this.filteredSkus();
    const selectedCount = filtered.filter((s) => this.isSelected(this.rowKey(s))).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  isAllSelected(): boolean {
    const filtered = this.filteredSkus();
    return filtered.length > 0 && filtered.every((s) => this.isSelected(this.rowKey(s)));
  }

  fromIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    return Math.min(
      this.totalItems(),
      (this.page() - 1) * this.pageSize() + this.filteredSkus().length
    );
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
