import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { JewelleryApiService } from './services/jewellery-api.service';
import { BarcodeScannerService } from './services/barcode-scanner.service';
import { Subscription } from 'rxjs';
import { WarningDialogComponent } from '../warning-dialog/warning-dialog.component';

@Component({
  selector: 'app-jewellery-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './jewellery-layout.component.html',
  styleUrls: ['./jewellery-layout.component.css']
})
export class JewelleryLayoutComponent implements OnInit, OnDestroy {
  sidebarOpen = true;
  activeScan = false;
  goldRate22K: number = 6950;
  goldRate24K: number = 7580;
  silverRate: number = 92;
  lastUpdatedTime: string = 'Just now';
  currentTheme: 'dark' | 'light' = 'dark';
  private scanSub?: Subscription;

  navItems = [
    { label: 'POS Terminal', route: '/jewellery/pos', icon: 'point_of_sale', badge: 'Fast' },
    { label: 'Dashboard', route: '/jewellery/dashboard', icon: 'dashboard' },
    { label: 'Rough Estimate', route: '/jewellery/estimate', icon: 'calculate' },
    { label: 'Stock Inward', route: '/jewellery/purchase', icon: 'add_shopping_cart' },
    { label: 'Inventory & Items', route: '/jewellery/inventory', icon: 'inventory_2' },
    { label: 'Barcode & Tags', route: '/jewellery/barcodes', icon: 'qr_code_2' },
    { label: 'Old Gold Exchange', route: '/jewellery/old-gold', icon: 'recycling' },
    { label: 'Reports & Books', route: '/jewellery/reports', icon: 'assessment' },
    { label: 'Online Pay & QR', route: '/jewellery/pay', icon: 'qr_code_scanner', badge: 'Razorpay' }
  ];

  constructor(
    private router: Router,
    private api: JewelleryApiService,
    private scanner: BarcodeScannerService,
    private dialog: MatDialog
  ) {}

  openSubscriptionPayment() {
    this.dialog.open(WarningDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: {
        isNotAuthenticated: false,
        isWarning: false,
        daysLeft: 30
      }
    });
  }

  ngOnInit() {
    const saved = localStorage.getItem('jewel_theme');
    if (saved === 'light' || saved === 'dark') {
      this.currentTheme = saved;
    } else {
      this.currentTheme = 'dark';
    }

    this.loadRates();
    this.scanSub = this.scanner.barcodeScanned$.subscribe(code => {
      this.activeScan = true;
      setTimeout(() => (this.activeScan = false), 1500);
    });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('jewel_theme', this.currentTheme);
  }

  loadRates() {
    this.api.getSettings().subscribe({
      next: (settings) => {
        if (Array.isArray(settings) && settings.length > 0) {
          const s = settings[0];
          if (s.goldrate) this.goldRate22K = Number(s.goldrate);
          if (s.silverrate) this.silverRate = Number(s.silverrate);
          this.goldRate24K = Math.round(this.goldRate22K * (24 / 22));
          this.lastUpdatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      },
      error: () => {}
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  goToPawnBroker() {
    this.router.navigate(['/pledge']);
  }

  logout() {
    localStorage.removeItem('token');
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    this.scanSub?.unsubscribe();
  }
}
