import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPrintService } from '../../services/jewellery-print.service';
import { PurchaseItem, Barcode } from '../../models/jewellery.models';

@Component({
  selector: 'app-jewellery-barcode-center',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './barcode-center.component.html',
  styleUrls: ['./barcode-center.component.css']
})
export class JewelleryBarcodeCenterComponent implements OnInit {
  items: PurchaseItem[] = [];
  selectedItems: Set<number> = new Set();
  previewItem: PurchaseItem | null = null;
  shopName = 'JEWELBANKERS';
  searchQuery = '';

  constructor(
    private api: JewelleryApiService,
    private printService: JewelleryPrintService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.api.getInventory({ status: 'AVAILABLE' }).subscribe({
      next: (data) => {
        this.items = data;
        if (this.items.length > 0) {
          this.previewItem = this.items[0];
        }
      }
    });
  }

  get filteredItems(): PurchaseItem[] {
    if (!this.searchQuery.trim()) return this.items;
    const q = this.searchQuery.toLowerCase().trim();
    return this.items.filter(i =>
      (i.itemName && i.itemName.toLowerCase().includes(q)) ||
      (i.barcode?.barcodeValue && i.barcode.barcodeValue.toLowerCase().includes(q)) ||
      (i.designNo && i.designNo.toLowerCase().includes(q))
    );
  }

  selectForPreview(item: PurchaseItem) {
    this.previewItem = item;
  }

  toggleSelect(id?: number) {
    if (!id) return;
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
    } else {
      this.selectedItems.add(id);
    }
  }

  selectAll() {
    for (const item of this.filteredItems) {
      if (item.id) this.selectedItems.add(item.id);
    }
  }

  clearSelection() {
    this.selectedItems.clear();
  }

  printSingle(item: PurchaseItem) {
    this.printService.printBarcodeLabel(item, this.shopName);
    if (item.barcode?.barcodeValue) {
      this.api.markBarcodePrinted(item.barcode.barcodeValue).subscribe();
    }
    this.toastr.success(`Printed label for ${item.barcode?.barcodeValue || 'Item'}`);
  }

  printBatch() {
    const selected = this.items.filter(i => i.id && this.selectedItems.has(i.id));
    if (selected.length === 0) {
      this.toastr.warning('Please select at least one item to print');
      return;
    }

    for (const item of selected) {
      this.printService.printBarcodeLabel(item, this.shopName);
      if (item.barcode?.barcodeValue) {
        this.api.markBarcodePrinted(item.barcode.barcodeValue).subscribe();
      }
    }
    this.toastr.success(`Dispatched ${selected.length} barcode labels to printer`);
  }

  getBarcodeImageUrl(barcodeVal?: string): string {
    if (!barcodeVal) return '';
    return this.api.getBarcodeImageUrl(barcodeVal);
  }
}
