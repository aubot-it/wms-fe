import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import './stock.component.css';

@Component({
  selector: 'app-inventory-stock',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Xem Tồn kho</h1>
      <div class="page-content">
        <p>Same</p>
      </div>
    </div>
  `,
  styleUrl: './stock.component.css'
})
export class InventoryStockComponent {}

