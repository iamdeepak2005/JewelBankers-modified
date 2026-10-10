import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPrintService } from '../../services/jewellery-print.service';
import { Sales, PurchaseItem } from '../../models/jewellery.models';

@Component({
  selector: 'app-jewellery-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class JewelleryReportsComponent implements OnInit {
  activeTab: 'sales' | 'inventory' | 'gst' = 'sales';
  salesList: Sales[] = [];
  inventoryList: PurchaseItem[] = [];
  searchDate = '';

  constructor(
    private api: JewelleryApiService,
    private printService: JewelleryPrintService
  ) {}

  ngOnInit() {
    this.loadSales();
    this.loadInventory();
  }

  loadSales() {
    this.api.getAllSales().subscribe({
      next: (sales) => (this.salesList = sales),
      error: () => {}
    });
  }

  loadInventory() {
    this.api.getInventory().subscribe({
      next: (items) => (this.inventoryList = items),
      error: () => {}
    });
  }

  get totalSalesTurnover(): number {
    return this.salesList.reduce((sum, s) => sum + (s.totalamount || 0), 0);
  }

  get totalTaxableTurnover(): number {
    return this.salesList.reduce((sum, s) => sum + (s.taxableAmount || s.billamount || 0), 0);
  }

  get totalGstCollected(): number {
    return this.salesList.reduce((sum, s) => sum + (s.gstamount || 0), 0);
  }

  get inventoryCategorySummary(): Array<{ category: string; count: number; weight: number; value: number }> {
    const map = new Map<string, { count: number; weight: number; value: number }>();

    for (const item of this.inventoryList) {
      if ((item.itemStatus || item.status) === 'AVAILABLE') {
        const cat = item.category || 'Uncategorized';
        const wt = item.grossweight || item.weight || 0;
        const val = item.totalamount || item.amount || 0;

        const current = map.get(cat) || { count: 0, weight: 0, value: 0 };
        current.count += 1;
        current.weight += wt;
        current.value += val;
        map.set(cat, current);
      }
    }

    return Array.from(map.entries()).map(([category, stats]) => ({
      category,
      count: stats.count,
      weight: Math.round(stats.weight * 1000) / 1000,
      value: Math.round(stats.value)
    }));
  }

  reprintInvoice(sale: Sales) {
    this.printService.printTaxInvoice(sale);
  }
}
