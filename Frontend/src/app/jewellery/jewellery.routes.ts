import { Routes } from '@angular/router';
import { JewelleryLayoutComponent } from './jewellery-layout.component';
import { JewelleryDashboardComponent } from './components/dashboard/dashboard.component';
import { JewelleryPosComponent } from './components/pos/pos.component';
import { JewelleryInventoryComponent } from './components/inventory/inventory.component';
import { JewelleryEstimateComponent } from './components/estimate/estimate.component';
import { JewelleryPurchaseComponent } from './components/purchase/purchase.component';
import { JewelleryBarcodeCenterComponent } from './components/barcode-center/barcode-center.component';
import { JewelleryOldGoldComponent } from './components/old-gold/old-gold.component';
import { JewelleryReportsComponent } from './components/reports/reports.component';

export const JEWELLERY_ROUTES: Routes = [
  {
    path: '',
    component: JewelleryLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: JewelleryDashboardComponent },
      { path: 'pos', component: JewelleryPosComponent },
      { path: 'inventory', component: JewelleryInventoryComponent },
      { path: 'estimate', component: JewelleryEstimateComponent },
      { path: 'purchase', component: JewelleryPurchaseComponent },
      { path: 'barcodes', component: JewelleryBarcodeCenterComponent },
      { path: 'old-gold', component: JewelleryOldGoldComponent },
      { path: 'reports', component: JewelleryReportsComponent },
      { path: 'pay', loadComponent: () => import('../payment-page/payment-page.component').then(m => m.PaymentPageComponent) },
      { path: 'payment', redirectTo: 'pay', pathMatch: 'full' }
    ]
  }
];
