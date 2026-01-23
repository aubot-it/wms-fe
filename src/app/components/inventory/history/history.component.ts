import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import './history.component.css';

@Component({
  selector: 'app-inventory-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Lịch sử Tồn kho</h1>
      <div class="page-content">
        <p>Đợi api </p>
      </div>
    </div>
  `,
  styleUrl: './history.component.css'
})
export class InventoryHistoryComponent {}

