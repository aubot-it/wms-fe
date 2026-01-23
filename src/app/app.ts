import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('wms-fe');
  
  openMenus: Set<string> = new Set(['masterData', 'inventory', 'shipCentral']); // Mở mặc định

  constructor(private router: Router) {
    // Tự động mở menu nếu route hiện tại thuộc menu đó
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.startsWith('/master-data')) {
        this.openMenus.add('masterData');
      } else if (url.startsWith('/inventory')) {
        this.openMenus.add('inventory');
      } else if (url.startsWith('/ship-central')) {
        this.openMenus.add('shipCentral');
      }
    });
  }

  toggleMenu(menu: string): void {
    if (this.openMenus.has(menu)) {
      this.openMenus.delete(menu);
    } else {
      this.openMenus.add(menu);
    }
  }

  isMenuOpen(menu: string): boolean {
    return this.openMenus.has(menu);
  }

  getUserDisplayName(): string {
    return 'Admin';
  }
}
