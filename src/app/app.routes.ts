import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  // Master Data routes
  {
    path: 'master-data',
    children: [
      {
        path: 'warehouse',
        loadComponent: () => import('./components/master-data/warehouse/warehouse.component').then(m => m.WarehouseComponent)
      },
      {
        path: 'zone',
        loadComponent: () => import('./components/master-data/zone/zone.component').then(m => m.ZoneComponent)
      },
      {
        path: 'sku',
        loadComponent: () => import('./components/master-data/sku/sku.component').then(m => m.SkuComponent)
      },
      {
        path: 'brand',
        loadComponent: () => import('./components/master-data/brand/brand.component').then(m => m.BrandComponent)
      },
      {
        path: '',
        redirectTo: 'warehouse',
        pathMatch: 'full'
      }
    ]
  },
  // Inbound routes
  {
    path: 'inbound',
    children: [
      {
        path: 'asn',
        loadComponent: () => import('./components/Inbound/Asn/asn.component').then(m => m.AsnComponent)
      },
      {
        path: 'asn-line',
        loadComponent: () => import('./components/Inbound/Asn-Line/asn-line.component').then(m => m.AsnLineComponent)
      },
      {
        path: 'pallet',
        loadComponent: () => import('./components/Inbound/Pallet/pallet.component').then(m => m.PalletComponent)
      },
      {
        path: '',
        redirectTo: 'asn',
        pathMatch: 'full'
      }
    ]
  },
  // Inventory routes
  {
    path: 'inventory',
    children: [
      {
        path: 'list',
        loadComponent: () => import('./components/inventory/list/list.component').then(m => m.InventoryListComponent)
      },
      {
        path: 'history',
        loadComponent: () => import('./components/inventory/history/history.component').then(m => m.InventoryHistoryComponent)
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      }
    ]
  },
  // Ship Central routes
  {
    path: 'ship-central',
    children: [
      {
        path: 'transportation',
        loadComponent: () => import('./components/ship-central/transportation/transportation.component').then(m => m.TransportationComponent)
      },
      {
        path: '',
        redirectTo: 'transportation',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
