import { Injectable, signal } from '@angular/core';
import { BrandDTO } from '../../../api/wcs.models';

@Injectable()
export class BrandTableStore {
  allBrands = signal<BrandDTO[]>([]);
  filteredBrands = signal<BrandDTO[]>([]);
  selectedBrands = signal<string[]>([]);

  page = signal<number>(1);
  pageSize = signal<number>(20);
  isLastPage = signal<boolean>(false);
  totalItems = signal<number>(0);
  totalPages = signal<number>(1);

  displayedColumns: string[] = ['select', 'brandId', 'brandCode', 'brandName', 'country', 'manufacturer', 'isActive'];

  filters: { name: string; code: string; keyword: string } = {
    name: '',
    code: '',
    keyword: ''
  };

  rowKey(b: BrandDTO): string {
    return b.brandId != null ? String(b.brandId) : b.brandCode;
  }

  applyClientFilters(): void {
    let filtered = [...this.allBrands()];

    if (this.filters.name) {
      filtered = filtered.filter((b) =>
        (b.brandName || '').toLowerCase().includes(this.filters.name.toLowerCase())
      );
    }

    if (this.filters.code) {
      filtered = filtered.filter((b) =>
        (b.brandCode || '').toLowerCase().includes(this.filters.code.toLowerCase())
      );
    }

    this.filteredBrands.set(filtered);
  }

  resetFilters(): void {
    this.filters = { name: '', code: '', keyword: '' };
  }

  toggleSelect(id: string): void {
    const selected = this.selectedBrands();
    if (selected.includes(id)) {
      this.selectedBrands.set(selected.filter((s) => s !== id));
    } else {
      this.selectedBrands.set([...selected, id]);
    }
  }

  toggleSelectAll(event: any): void {
    const checked = event.checked;
    if (checked) {
      this.selectedBrands.set(this.filteredBrands().map((b) => this.rowKey(b)));
    } else {
      this.selectedBrands.set([]);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedBrands().includes(id);
  }

  isSomeSelected(): boolean {
    const filtered = this.filteredBrands();
    const selectedCount = filtered.filter((b) => this.isSelected(this.rowKey(b))).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  }

  isAllSelected(): boolean {
    const filtered = this.filteredBrands();
    return filtered.length > 0 && filtered.every((b) => this.isSelected(this.rowKey(b)));
  }

  fromIndex(): number {
    if (this.totalItems() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  }

  toIndex(): number {
    if (this.totalItems() === 0) return 0;
    return Math.min(
      this.totalItems(),
      (this.page() - 1) * this.pageSize() + this.filteredBrands().length
    );
  }

  pages(): number[] {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}

