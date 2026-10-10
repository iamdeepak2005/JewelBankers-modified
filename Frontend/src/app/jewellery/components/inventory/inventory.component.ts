import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPrintService } from '../../services/jewellery-print.service';
import { PurchaseItem, ItemStatus, MetalType, InventoryMovement } from '../../models/jewellery.models';

@Component({
  selector: 'app-jewellery-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css']
})
export class JewelleryInventoryComponent implements OnInit {
  items: PurchaseItem[] = [];
  filteredItems: PurchaseItem[] = [];
  loading = true;

  // Filters
  selectedStatus: ItemStatus | 'ALL' = 'ALL';
  selectedMetal: MetalType | 'ALL' = 'ALL';
  searchQuery = '';

  // Modals & Details
  selectedItemForMovements: PurchaseItem | null = null;
  itemMovements: InventoryMovement[] = [];
  editingLocationItem: PurchaseItem | null = null;
  newLocation = { counter: '', tray: '', rack: '' };

  // Summary Metrics
  stats = {
    totalItems: 0,
    availableItems: 0,
    soldItems: 0,
    totalGoldWeightGrams: 0,
    totalSilverWeightGrams: 0,
    totalStockValue: 0
  };

  constructor(
    private api: JewelleryApiService,
    private printService: JewelleryPrintService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadInventory();
    this.loadStats();
  }

  loadInventory() {
    this.loading = true;
    this.api.getInventory().subscribe({
      next: (data) => {
        this.items = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to load inventory', err);
      }
    });
  }

  loadStats() {
    this.api.getInventoryStats().subscribe({
      next: (s) => (this.stats = s),
      error: () => {}
    });
  }

  applyFilters() {
    this.filteredItems = this.items.filter((item) => {
      let match = true;
      const status = item.itemStatus || (item.status === 'SOLD' ? 'SOLD' : 'AVAILABLE');

      if (this.selectedStatus !== 'ALL' && status !== this.selectedStatus) {
        match = false;
      }

      if (match && this.selectedMetal !== 'ALL' && item.metalType !== this.selectedMetal) {
        match = false;
      }

      if (match && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchesSearch =
          (item.itemName && item.itemName.toLowerCase().includes(q)) ||
          (item.designNo && item.designNo.toLowerCase().includes(q)) ||
          (item.huid && item.huid.toLowerCase().includes(q)) ||
          (item.barcode?.barcodeValue && item.barcode.barcodeValue.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q));
        if (!matchesSearch) {
          match = false;
        }
      }

      return match;
    });
  }

  printLabel(item: PurchaseItem) {
    this.printService.printBarcodeLabel(item);
    if (item.barcode?.barcodeValue) {
      this.api.markBarcodePrinted(item.barcode.barcodeValue).subscribe();
    }
  }

  changeStatus(item: PurchaseItem, newStatus: ItemStatus) {
    if (!item.id) return;
    this.api.updateItemStatus(item.id, newStatus, `Manual status change to ${newStatus}`).subscribe({
      next: (updated) => {
        item.itemStatus = updated.itemStatus;
        item.status = updated.status;
        this.toastr.success(`Item status updated to ${newStatus}`);
        this.applyFilters();
        this.loadStats();
      },
      error: () => this.toastr.error('Failed to update status')
    });
  }

  openLocationModal(item: PurchaseItem) {
    this.editingLocationItem = item;
    this.newLocation = {
      counter: item.counter || '',
      tray: item.tray || '',
      rack: item.rack || ''
    };
  }

  saveLocation() {
    if (!this.editingLocationItem?.id) return;
    this.api.updateItemLocation(this.editingLocationItem.id, this.newLocation).subscribe({
      next: (updated) => {
        this.editingLocationItem!.counter = updated.counter;
        this.editingLocationItem!.tray = updated.tray;
        this.editingLocationItem!.rack = updated.rack;
        this.editingLocationItem!.location = updated.location;
        this.toastr.success('Location updated');
        this.editingLocationItem = null;
      },
      error: () => this.toastr.error('Failed to update location')
    });
  }

  viewMovements(item: PurchaseItem) {
    if (!item.id) return;
    this.selectedItemForMovements = item;
    this.api.getItemMovements(item.id).subscribe({
      next: (movs) => (this.itemMovements = movs),
      error: () => (this.itemMovements = [])
    });
  }
}
