import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import './warehouse.component.css';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  type: string;
  status: 'active' | 'inactive' | 'maintenance';
  capacity: number;
  currentStock: number;
  manager: string;
  phone: string;
  createdAt: string;
}

@Component({
  selector: 'app-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="warehouse-container">
      <div class="warehouse-header">
        <h1 class="warehouse-title">Warehouse</h1>
        <div class="warehouse-actions">
          <button class="btn btn-primary" (click)="onAdd()">
            <span>➕</span>
            <span>Thêm</span>
          </button>
          <button class="btn btn-danger" (click)="onDelete()" [disabled]="selectedWarehouses().length === 0">
            <span>🗑️</span>
            <span>Xóa</span>
          </button>
          <button class="btn btn-secondary" (click)="onUpdate()" [disabled]="selectedWarehouses().length !== 1">
            <span>✏️</span>
            <span>Cập nhật</span>
          </button>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Tên kho</label>
            <input
              type="text"
              class="filter-input"
              placeholder="Nhập tên kho..."
              [(ngModel)]="filters.name"
              (input)="applyFilters()"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Trạng thái</label>
            <select
              class="filter-select"
              [(ngModel)]="filters.status"
              (change)="applyFilters()"
            >
              <option value="">Tất cả</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Loại kho</label>
            <select
              class="filter-select"
              [(ngModel)]="filters.type"
              (change)="applyFilters()"
            >
              <option value="">Tất cả</option>
              <option value="cold">Kho lạnh</option>
              <option value="dry">Kho khô</option>
              <option value="hazardous">Kho nguy hiểm</option>
              <option value="general">Kho thường</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Mã kho</label>
            <input
              type="text"
              class="filter-input"
              placeholder="Nhập mã kho..."
              [(ngModel)]="filters.code"
              (input)="applyFilters()"
            />
          </div>
          <div class="filter-group">
            <button class="btn btn-clear" (click)="clearFilters()">
              <span>🔄</span>
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-info">
            <span>Tổng số: <strong>{{ filteredWarehouses().length }}</strong></span>
            @if (selectedWarehouses().length > 0) {
              <span class="selected-info">Đã chọn: <strong>{{ selectedWarehouses().length }}</strong></span>
            }
          </div>
        </div>

        <div class="table-wrapper">
          <table class="warehouse-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input
                    type="checkbox"
                    [checked]="isAllSelected()"
                    (change)="toggleSelectAll($event)"
                  />
                </th>
                <th>Mã kho</th>
                <th>Tên kho</th>
                <th>Địa chỉ</th>
                <th>Loại kho</th>
                <th>Trạng thái</th>
                <th>Sức chứa</th>
                <th>Tồn hiện tại</th>
                <th>Người quản lý</th>
                <th>Số điện thoại</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              @if (filteredWarehouses().length === 0) {
                <tr>
                  <td colspan="11" class="empty-state">
                    <div class="empty-message">
                      <span>📦</span>
                      <p>Không tìm thấy kho nào</p>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (warehouse of filteredWarehouses(); track warehouse.id) {
                  <tr [class.selected]="isSelected(warehouse.id)">
                    <td class="checkbox-col">
                      <input
                        type="checkbox"
                        [checked]="isSelected(warehouse.id)"
                        (change)="toggleSelect(warehouse.id)"
                      />
                    </td>
                    <td><strong>{{ warehouse.code }}</strong></td>
                    <td>{{ warehouse.name }}</td>
                    <td>{{ warehouse.address }}</td>
                    <td>
                      <span class="badge badge-type">{{ getTypeLabel(warehouse.type) }}</span>
                    </td>
                    <td>
                      <span class="badge" [class.badge-active]="warehouse.status === 'active'"
                            [class.badge-inactive]="warehouse.status === 'inactive'"
                            [class.badge-maintenance]="warehouse.status === 'maintenance'">
                        {{ getStatusLabel(warehouse.status) }}
                      </span>
                    </td>
                    <td>{{ warehouse.capacity | number }} m²</td>
                    <td>
                      <span [class.text-warning]="warehouse.currentStock / warehouse.capacity > 0.8">
                        {{ warehouse.currentStock | number }} m²
                      </span>
                    </td>
                    <td>{{ warehouse.manager }}</td>
                    <td>{{ warehouse.phone }}</td>
                    <td>{{ formatDate(warehouse.createdAt) }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './warehouse.component.css'
})
export class WarehouseComponent {
  // Mock data
  private warehouses: Warehouse[] = [
    {
      id: '1',
      name: 'Kho Hà Nội',
      code: 'WH-HN-001',
      address: '123 Đường ABC, Quận 1, Hà Nội',
      type: 'general',
      status: 'active',
      capacity: 5000,
      currentStock: 3200,
      manager: 'Nguyễn Văn A',
      phone: '0901234567',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Kho Hồ Chí Minh',
      code: 'WH-HCM-001',
      address: '456 Đường XYZ, Quận 7, TP.HCM',
      type: 'cold',
      status: 'active',
      capacity: 8000,
      currentStock: 6500,
      manager: 'Trần Thị B',
      phone: '0907654321',
      createdAt: '2024-02-20'
    },
    {
      id: '3',
      name: 'Kho Đà Nẵng',
      code: 'WH-DN-001',
      address: '789 Đường DEF, Quận Hải Châu, Đà Nẵng',
      type: 'dry',
      status: 'active',
      capacity: 3000,
      currentStock: 1500,
      manager: 'Lê Văn C',
      phone: '0912345678',
      createdAt: '2024-03-10'
    },
    {
      id: '4',
      name: 'Kho Hải Phòng',
      code: 'WH-HP-001',
      address: '321 Đường GHI, Quận Ngô Quyền, Hải Phòng',
      type: 'hazardous',
      status: 'maintenance',
      capacity: 2000,
      currentStock: 0,
      manager: 'Phạm Thị D',
      phone: '0923456789',
      createdAt: '2024-01-05'
    },
    {
      id: '5',
      name: 'Kho Cần Thơ',
      code: 'WH-CT-001',
      address: '654 Đường JKL, Quận Ninh Kiều, Cần Thơ',
      type: 'general',
      status: 'inactive',
      capacity: 4000,
      currentStock: 0,
      manager: 'Hoàng Văn E',
      phone: '0934567890',
      createdAt: '2023-12-20'
    },
    {
      id: '6',
      name: 'Kho Bình Dương',
      code: 'WH-BD-001',
      address: '987 Đường MNO, Thủ Dầu Một, Bình Dương',
      type: 'cold',
      status: 'active',
      capacity: 6000,
      currentStock: 4800,
      manager: 'Vũ Thị F',
      phone: '0945678901',
      createdAt: '2024-02-28'
    }
  ];

  allWarehouses = signal<Warehouse[]>(this.warehouses);
  filteredWarehouses = signal<Warehouse[]>(this.warehouses);
  selectedWarehouses = signal<string[]>([]);

  filters = {
    name: '',
    code: '',
    status: '',
    type: ''
  };

  applyFilters(): void {
    let filtered = [...this.allWarehouses()];

    if (this.filters.name) {
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(this.filters.name.toLowerCase())
      );
    }

    if (this.filters.code) {
      filtered = filtered.filter(w =>
        w.code.toLowerCase().includes(this.filters.code.toLowerCase())
      );
    }

    if (this.filters.status) {
      filtered = filtered.filter(w => w.status === this.filters.status);
    }

    if (this.filters.type) {
      filtered = filtered.filter(w => w.type === this.filters.type);
    }

    this.filteredWarehouses.set(filtered);
  }

  clearFilters(): void {
    this.filters = {
      name: '',
      code: '',
      status: '',
      type: ''
    };
    this.filteredWarehouses.set([...this.allWarehouses()]);
  }

  toggleSelect(id: string): void {
    const selected = this.selectedWarehouses();
    if (selected.includes(id)) {
      this.selectedWarehouses.set(selected.filter(s => s !== id));
    } else {
      this.selectedWarehouses.set([...selected, id]);
    }
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedWarehouses.set(this.filteredWarehouses().map(w => w.id));
    } else {
      this.selectedWarehouses.set([]);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedWarehouses().includes(id);
  }

  isAllSelected(): boolean {
    const filtered = this.filteredWarehouses();
    return filtered.length > 0 && filtered.every(w => this.isSelected(w.id));
  }

  onAdd(): void {
    alert('Them kho coi như ok');
  }

  onDelete(): void {
    const selected = this.selectedWarehouses();
    if (selected.length === 0) return;

    if (confirm(`Bạn có chắc chắn muốn xóa ${selected.length} kho đã chọn?`)) {
      const remaining = this.allWarehouses().filter(w => !selected.includes(w.id));
      this.allWarehouses.set(remaining);
      this.applyFilters();
      this.selectedWarehouses.set([]);
      alert(`Đã xóa ${selected.length} kho`);
    }
  }

  onUpdate(): void {
    const selected = this.selectedWarehouses();
    if (selected.length !== 1) return;

    const warehouse = this.allWarehouses().find(w => w.id === selected[0]);
    alert(`cập nhật kho "${warehouse?.name}" coi như ok`);
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Hoạt động',
      'inactive': 'Ngừng hoạt động',
      'maintenance': 'Bảo trì'
    };
    return labels[status] || status;
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'cold': 'Kho lạnh',
      'dry': 'Kho khô',
      'hazardous': 'Kho nguy hiểm',
      'general': 'Kho thường'
    };
    return labels[type] || type;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }
}

