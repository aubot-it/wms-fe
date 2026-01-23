import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import './transportation.component.css';

@Component({
  selector: 'app-transportation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Vận chuyển (Transportation)</h1>
      <div class="page-content">
        <p>Đợi api</p>
      </div>
    </div>
  `,
  styleUrl: './transportation.component.css'
})
export class TransportationComponent {}

