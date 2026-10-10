import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPrintService } from '../../services/jewellery-print.service';
import { Supplier, Purchase, PurchaseItem, MetalType } from '../../models/jewellery.models';

interface PurchaseDraftRow {
  itemName: string;
  category: string;
  metalType: MetalType;
  designNo: string;
  huid: string;
  quantity: number;
  grossWeight: number | null;
  stoneWeight: number;
  purity: number;
  rate: number | null;
  makingCharge: number;
  wastagePercent: number;
  rack: string;
  tray: string;
  counter: string;
}

@Component({
  selector: 'app-jewellery-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css']
})
export class JewelleryPurchaseComponent implements OnInit, OnDestroy {
  private readonly DRAFT_STORAGE_KEY = 'jewel_purchase_draft';
  hasRestoredDraft = false;

  suppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
  selectedSupplierIndex = '-1';
  supplierSearchText = '';
  showSupplierDropdown = false;
  invoicePrefix = 'PUR';
  comments = '';

  // Quick Add Supplier state
  showAddSupplierModal = false;
  savingSupplier = false;
  newSupplier = {
    suppliername: '',
    mobile: '',
    address: '',
    gstno: '',
    openingbalance: 0
  };

  rows: PurchaseDraftRow[] = [];
  submitting = false;

  defaultCategories = ['Ring', 'Bangle', 'Necklace', 'Chain', 'Earring', 'Pendant', 'Coin', 'Bracelet', 'Mangalsutra', 'Other'];

  constructor(
    private api: JewelleryApiService,
    private printService: JewelleryPrintService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadSuppliers();

    // Check for AI-driven pre-fill state
    const state = history.state;
    const prefill = state?.prefillStock || state?.prefillData?.prefillStock || state;
    const incomingItems = prefill?.items;

    if (Array.isArray(incomingItems) && incomingItems.length > 0) {
      if (prefill.comments) {
        this.comments = prefill.comments;
      }
      this.rows = incomingItems.map((item: any) => ({
        itemName: item.itemName || '',
        category: item.category || 'Ring',
        metalType: (item.metalType || item.itemType || 'GOLD').toUpperCase() as MetalType,
        designNo: item.designNo || '',
        huid: item.huid || '',
        quantity: Number(item.quantity) || 1,
        grossWeight: Number(item.grossweight || item.grossWeight || item.weight) || null,
        stoneWeight: Number(item.stoneWeight) || 0,
        purity: Number(item.purity) || 91.6,
        rate: Number(item.rate || item.pricePerGram) || null,
        makingCharge: Number(item.makingCharges || item.makingCharge) || 0,
        wastagePercent: Number(item.wastagePercent) || 0,
        counter: item.counter || 'Counter-1',
        tray: item.tray || '',
        rack: item.rack || 'Safe-1'
      }));
      this.toastr.info(`AI pre-filled ${this.rows.length} item(s). Review details and click "Save & Add Stock".`, 'AI Stock Inward');
    } else {
      // Check for user's unsaved draft from a previous navigation
      const rawDraft = sessionStorage.getItem(this.DRAFT_STORAGE_KEY);
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft);
          if (Array.isArray(draft.rows) && draft.rows.length > 0) {
            this.rows = draft.rows;
            if (draft.comments) this.comments = draft.comments;
            if (draft.invoicePrefix) this.invoicePrefix = draft.invoicePrefix;
            if (draft.selectedSupplier) {
              this.selectedSupplier = draft.selectedSupplier;
            }
            this.hasRestoredDraft = true;
            this.toastr.info('Restored your unsaved inward batch draft.', 'Draft Restored');
          } else {
            this.rows = [];
          }
        } catch {
          this.rows = [];
        }
      } else {
        // Start completely clean — NO pre-added dummy items
        this.rows = [];
      }
    }
  }

  ngOnDestroy() {
    this.saveDraft();
  }

  saveDraft() {
    if (this.rows && this.rows.length > 0) {
      const draft = {
        rows: this.rows,
        selectedSupplier: this.selectedSupplier,
        invoicePrefix: this.invoicePrefix,
        comments: this.comments
      };
      sessionStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } else {
      sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
    }
  }

  clearDraft() {
    sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
    this.rows = [];
    this.comments = '';
    this.selectedSupplier = null;
    this.selectedSupplierIndex = '-1';
    this.hasRestoredDraft = false;
    this.toastr.info('Cleared inward batch items.', 'Reset');
  }

  loadSuppliers() {
    this.api.getAllSuppliers().subscribe({
      next: (s) => {
        this.suppliers = Array.isArray(s) ? s : [];
        if (this.selectedSupplier) {
          const idx = this.suppliers.findIndex(item => item.id === this.selectedSupplier?.id);
          this.selectedSupplierIndex = idx >= 0 ? String(idx) : '-1';
        }
      },
      error: () => {}
    });
  }

  get filteredSuppliers(): Supplier[] {
    const q = (this.supplierSearchText || '').trim().toLowerCase();
    if (!q) {
      return this.suppliers.slice(0, 15);
    }
    return this.suppliers.filter(s => {
      const name = (s.suppliername || s.supplierName || '').toLowerCase();
      const phone = String(s.mobile || s.phonenumber || s.phoneNumber || '');
      const addr = (s.address || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || addr.includes(q);
    }).slice(0, 20);
  }

  selectSupplier(s: Supplier) {
    this.selectedSupplier = s;
    this.supplierSearchText = '';
    this.showSupplierDropdown = false;
    this.saveDraft();
    this.toastr.info(`Supplier selected: ${s.suppliername || s.supplierName}`);
  }

  selectDirectSupplier() {
    this.selectedSupplier = null;
    this.supplierSearchText = '';
    this.showSupplierDropdown = false;
    this.saveDraft();
  }

  clearSupplier() {
    this.selectedSupplier = null;
    this.supplierSearchText = '';
    this.showSupplierDropdown = false;
    this.saveDraft();
  }

  openQuickAddSupplierModal() {
    this.newSupplier = {
      suppliername: this.supplierSearchText.trim(),
      mobile: '',
      address: '',
      gstno: '',
      openingbalance: 0
    };
    this.showAddSupplierModal = true;
    this.showSupplierDropdown = false;
  }

  closeQuickAddSupplierModal() {
    this.showAddSupplierModal = false;
  }

  saveQuickSupplier() {
    if (!this.newSupplier.suppliername || !this.newSupplier.suppliername.trim()) {
      this.toastr.warning('Please enter the Supplier / Karigar Name (Compulsory)', 'Validation');
      return;
    }

    const payload: Partial<Supplier> = {
      suppliername: this.newSupplier.suppliername.trim(),
      mobile: this.newSupplier.mobile?.trim() || undefined,
      phonenumber: this.newSupplier.mobile?.trim() || undefined,
      address: this.newSupplier.address?.trim() || undefined,
      gstno: this.newSupplier.gstno?.trim() || undefined,
      gstnumber: this.newSupplier.gstno?.trim() || undefined
    };

    this.savingSupplier = true;
    this.api.createSupplier(payload).subscribe({
      next: (created: any) => {
        this.savingSupplier = false;
        const normalizedSupplier: Supplier = typeof created === 'object' && created ? created : {
          ...payload,
          id: Date.now()
        };

        // Add to suppliers list
        this.suppliers.unshift(normalizedSupplier);
        this.selectSupplier(normalizedSupplier);
        this.toastr.success(`Supplier "${normalizedSupplier.suppliername}" added and selected!`, 'Success');
        this.showAddSupplierModal = false;
      },
      error: (err) => {
        this.savingSupplier = false;
        this.toastr.error('Failed to create supplier. Please try again.', 'Error');
        console.error('Create supplier error', err);
      }
    });
  }

  addNewRow() {
    this.rows.push({
      itemName: '',
      category: 'Ring',
      metalType: 'GOLD',
      designNo: '',
      huid: '',
      quantity: 1,
      grossWeight: null as any,
      stoneWeight: 0,
      purity: 91.6,
      rate: null as any,
      makingCharge: 0,
      wastagePercent: 0,
      counter: 'Counter-1',
      tray: '',
      rack: 'Safe-1'
    });
    this.saveDraft();
  }

  removeRow(index: number) {
    this.rows.splice(index, 1);
    this.saveDraft();
  }

  get totalItemsCount(): number {
    return this.rows.reduce((sum, r) => sum + (Number(r.quantity) || 1), 0);
  }

  get totalGrossWeight(): number {
    return this.rows.reduce((sum, r) => sum + (Number(r.grossWeight) || 0) * (Number(r.quantity) || 1), 0);
  }

  get totalEstimatedCost(): number {
    return this.rows.reduce((sum, r) => {
      const net = Math.max(0, (r.grossWeight || 0) - (r.stoneWeight || 0));
      const metalVal = net * (r.rate || 0);
      const making = (r.makingCharge || 0) * (Number(r.quantity) || 1);
      return sum + (metalVal * (Number(r.quantity) || 1) + making);
    }, 0);
  }

  saveStockInward(printLabels: boolean = true) {
    if (this.rows.length === 0) {
      this.toastr.warning('Please add at least one inventory item');
      return;
    }

    const hasInvalid = this.rows.some(r => !r.itemName?.trim() || !r.grossWeight || r.grossWeight <= 0);
    if (hasInvalid) {
      this.toastr.warning('Please enter an item description and gross weight (> 0g) for all rows before saving.', 'Validation');
      return;
    }

    const purchaseItems: PurchaseItem[] = [];

    for (const r of this.rows) {
      const qty = Number(r.quantity) || 1;
      const net = Math.max(0, (r.grossWeight || 0) - (r.stoneWeight || 0));
      const metalVal = net * (r.rate || 0);
      const itemTotal = metalVal + (r.makingCharge || 0);

      purchaseItems.push({
        itemName: r.itemName,
        category: r.category,
        metalType: r.metalType,
        designNo: r.designNo,
        huid: r.huid,
        quantity: qty,
        grossweight: r.grossWeight ?? undefined,
        netWeight: net,
        weight: net,
        stoneweight: r.stoneWeight,
        purity: r.purity,
        rate: r.rate ?? undefined,
        makingCharge: r.makingCharge,
        wastagepercent: r.wastagePercent,
        location: `${r.counter}-${r.tray}-${r.rack}`,
        counter: r.counter,
        tray: r.tray,
        rack: r.rack,
        amount: metalVal,
        totalamount: itemTotal,
        status: 'AVAILABLE'
      });
    }

    const purchasePayload: Purchase = {
      supplier: this.selectedSupplier || undefined,
      invoiceprefix: this.invoicePrefix,
      invoicedatetime: new Date().toISOString(),
      comments: this.comments,
      totalamount: this.totalEstimatedCost,
      status: 'P',
      purchaseItems
    };

    this.submitting = true;
    this.api.savePurchase(purchasePayload).subscribe({
      next: (saved) => {
        this.submitting = false;
        this.toastr.success(`Stock Inward Invoice #${saved.invoiceno || saved.id} saved with ${this.totalItemsCount} pieces!`);

        if (printLabels && saved.purchaseItems) {
          // Print label for each item
          for (const pi of saved.purchaseItems) {
            this.printService.printBarcodeLabel(pi);
          }
        }

        // Reset state & clear draft upon successful save
        sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
        this.rows = [];
        this.comments = '';
        this.hasRestoredDraft = false;
      },
      error: (err) => {
        this.submitting = false;
        this.toastr.error('Failed to save purchase');
        console.error('Purchase save error', err);
      }
    });
  }
}
