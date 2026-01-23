import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import './zone.component.css';

@Component({
  selector: 'app-zone',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Zone</h1>
      <div class="page-content">
        <p>Zones</p>
      </div>
    </div>
  `,
  styleUrl: './zone.component.css'
})
export class ZoneComponent {}

