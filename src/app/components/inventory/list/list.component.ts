import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import './list.component.css';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Danh sách Tồn kho</h1>
      <div class="page-content">
        <p>Same</p>
      </div>
    </div>
  `,
  styleUrl: './list.component.css'
})
export class InventoryListComponent {}

