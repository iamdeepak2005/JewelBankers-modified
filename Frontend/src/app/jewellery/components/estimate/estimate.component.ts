import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPricingService } from '../../services/jewellery-pricing.service';
import { JewelleryPrintService } from '../../services/jewellery-print.service';
import { BarcodeScannerService } from '../../services/barcode-scanner.service';
import { Estimate, EstimateItem, Customer, MakingChargeType, MetalType, PurchaseItem } from '../../models/jewellery.models';

interface EstimateDraftItem {
  itemName: string;
  barcode?: string;
  metalType?: MetalType;
  designNo?: string;
  huid?: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  purity: number;
  rate: number;
  wastagePercent: number;
  makingChargeType: MakingChargeType;
  makingChargeRate: number;
  makingChargeAmount: number;
  metalValue: number;
  stoneAmount: number;
  hallmarkCharge: number;
  taxableAmount: number;
  gstAmount: number;
  itemTotal: number;
}

@Component({
  selector: 'app-jewellery-estimate',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './estimate.component.html',
  styleUrls: ['./estimate.component.css']
})
export class JewelleryEstimateComponent implements OnInit, OnDestroy {
  private readonly DRAFT_STORAGE_KEY = 'jewel_estimate_draft';
  hasRestoredDraft = false;

  items: EstimateDraftItem[] = [];
  savedEstimates: Estimate[] = [];
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  goldRate = 6950;
  silverRate = 92;
  notes = '';
  submitting = false;

  // Barcode search & hardware scanning
  barcodeInput = '';
  scanning = false;
  private scanSub?: Subscription;

  // Customer search & autocomplete
  customerSearchText = '';
  showCustomerDropdown = false;
  savingCustomer = false;

  // Quick Add Customer Modal
  showAddCustomerModal = false;
  newCustomer: {
    customerName: string;
    phoneno: string;
    address: string;
    area: string;
    city: string;
    pincode: string;
  } = {
    customerName: '',
    phoneno: '',
    address: '',
    area: '',
    city: 'Chennai',
    pincode: ''
  };

  constructor(
    private api: JewelleryApiService,
    private pricing: JewelleryPricingService,
    private printService: JewelleryPrintService,
    private scanner: BarcodeScannerService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadRates();
    this.loadCustomers();
    this.loadActiveEstimates();

    // Listen to hardware barcode scanner
    this.scanSub = this.scanner.barcodeScanned$.subscribe(code => {
      this.scanBarcode(code);
    });

    // Check for AI-driven pre-fill state
    const state = history.state;
    const prefill = state?.prefillEstimate || state?.prefillData?.prefillEstimate || state;
    if (prefill?.items && Array.isArray(prefill.items) && prefill.items.length > 0) {
      this.items = prefill.items.map((it: any) => {
        const gross = Number(it.grossweight || it.grossWeight || it.weight || 0);
        const stone = Number(it.stoneWeight || it.stoneweight || 0);
        const net = Number(it.netWeight || (gross - stone > 0 ? gross - stone : gross));
        const metal = (it.metalType || it.itemType || 'GOLD').toUpperCase() as MetalType;
        const rate = metal === 'SILVER' ? this.silverRate : this.goldRate;
        const draft: EstimateDraftItem = {
          itemName: it.itemName || '',
          barcode: it.barcode || it.barcodeValue || undefined,
          metalType: metal,
          grossWeight: gross,
          stoneWeight: stone,
          netWeight: net,
          purity: Number(it.purity || (metal === 'SILVER' ? 99.9 : 91.6)),
          rate: Number(it.rate || rate),
          wastagePercent: Number(it.wastagePercent || 0),
          makingChargeType: (it.makingChargeType || 'PERCENT') as MakingChargeType,
          makingChargeRate: Number(it.makingCharges || it.makingChargeRate || 0),
          makingChargeAmount: 0,
          metalValue: 0,
          stoneAmount: 0,
          hallmarkCharge: 0,
          taxableAmount: 0,
          gstAmount: 0,
          itemTotal: 0
        };
        this.recalculateItem(draft);
        return draft;
      });
      this.toastr.info(`AI pre-filled ${this.items.length} item(s) for quotation.`);
    } else {
      // Check for unsaved user draft from previous navigation
      const rawDraft = sessionStorage.getItem(this.DRAFT_STORAGE_KEY);
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft);
          if (Array.isArray(draft.items) && draft.items.length > 0) {
            this.items = draft.items;
            if (draft.selectedCustomer) {
              this.selectedCustomer = draft.selectedCustomer;
            }
            if (draft.notes) {
              this.notes = draft.notes;
            }
            this.hasRestoredDraft = true;
            this.recalculateAll();
            this.toastr.info('Restored your unsaved quotation draft.', 'Draft Restored');
          } else {
            this.items = [];
          }
        } catch {
          this.items = [];
        }
      } else {
        // Start completely clean — NO pre-added dummy items
        this.items = [];
      }
    }
  }

  ngOnDestroy() {
    this.saveDraft();
    if (this.scanSub) {
      this.scanSub.unsubscribe();
    }
  }

  saveDraft() {
    if (this.items && this.items.length > 0) {
      const draft = {
        items: this.items,
        selectedCustomer: this.selectedCustomer,
        notes: this.notes
      };
      sessionStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } else {
      sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
    }
  }

  clearDraft() {
    sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
    this.items = [];
    this.selectedCustomer = null;
    this.notes = '';
    this.hasRestoredDraft = false;
    this.toastr.info('Cleared quotation items.', 'Reset');
  }

  onBarcodeSubmit() {
    const code = this.barcodeInput.trim();
    if (!code) return;
    this.scanBarcode(code);
    this.barcodeInput = '';
  }

  scanBarcode(code: string) {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Check if already in items list
    const existing = this.items.find(it => it.barcode && it.barcode.toUpperCase() === cleanCode.toUpperCase());
    if (existing) {
      this.toastr.warning(`Item with barcode ${cleanCode} is already in the quotation list`);
      return;
    }

    this.scanning = true;
    this.api.getInventoryItemByBarcode(cleanCode).subscribe({
      next: (item: PurchaseItem) => {
        this.scanning = false;
        this.addItemFromInventory(item, cleanCode);
        this.toastr.success(`Added ${item.itemName || 'Item'} (${cleanCode}) to estimate`);
      },
      error: () => {
        this.scanning = false;
        this.toastr.info(`Barcode ${cleanCode} not in vault. Added custom line.`);
        this.addItemWithBarcode(cleanCode);
      }
    });
  }

  addItemFromInventory(invItem: PurchaseItem, barcode: string) {
    const gross = Number(invItem.grossweight || invItem.weight || 0);
    const stone = Number(invItem.stoneweight || 0);
    const net = Number(invItem.netWeight || (gross - stone > 0 ? gross - stone : gross));
    const metalType = ((invItem.metalType || 'GOLD') as MetalType);
    const rate = metalType === 'SILVER' ? this.silverRate : this.goldRate;
    const purity = Number(invItem.purity) || (metalType === 'SILVER' ? 99.9 : 91.6);
    const chargeType: MakingChargeType = invItem.makingChargeType || 'PERCENT';
    const chargeRate = invItem.makingCharge ? Number(invItem.makingCharge) : 10;
    const wastage = Number(invItem.wastagepercent) || 0;

    const newItem: EstimateDraftItem = {
      itemName: invItem.itemName || 'Ornament',
      barcode: barcode,
      metalType: metalType,
      designNo: invItem.designNo || '',
      huid: invItem.huid || '',
      grossWeight: gross,
      stoneWeight: stone,
      netWeight: net,
      purity: purity,
      rate: rate,
      wastagePercent: wastage,
      makingChargeType: chargeType,
      makingChargeRate: chargeRate,
      makingChargeAmount: 0,
      metalValue: 0,
      stoneAmount: 0,
      hallmarkCharge: 45,
      taxableAmount: 0,
      gstAmount: 0,
      itemTotal: 0
    };

    this.recalculateItem(newItem);

    // If single untouched empty row, replace it
    if (this.items.length === 1 && !this.items[0].itemName && !this.items[0].grossWeight && !this.items[0].barcode) {
      this.items = [newItem];
    } else {
      this.items.push(newItem);
    }
    this.saveDraft();
  }

  addItemWithBarcode(barcode: string) {
    const newItem: EstimateDraftItem = {
      itemName: `Custom Item (${barcode})`,
      barcode: barcode,
      metalType: 'GOLD',
      grossWeight: null as any,
      stoneWeight: 0,
      netWeight: 0,
      purity: 91.6,
      rate: this.goldRate,
      wastagePercent: 0,
      makingChargeType: 'PERCENT',
      makingChargeRate: 0,
      makingChargeAmount: 0,
      metalValue: 0,
      stoneAmount: 0,
      hallmarkCharge: 0,
      taxableAmount: 0,
      gstAmount: 0,
      itemTotal: 0
    };

    this.recalculateItem(newItem);

    if (this.items.length === 1 && !this.items[0].itemName && !this.items[0].grossWeight && !this.items[0].barcode) {
      this.items = [newItem];
    } else {
      this.items.push(newItem);
    }
    this.saveDraft();
  }

  loadRates() {
    this.api.getSettings().subscribe({
      next: (settings) => {
        if (Array.isArray(settings) && settings.length > 0) {
          const s = settings[0];
          if (s.goldrate) this.goldRate = Number(s.goldrate);
          if (s.silverrate) this.silverRate = Number(s.silverrate);
          this.recalculateAll();
        }
      }
    });
  }

  loadCustomers() {
    this.api.getAllCustomers().subscribe({
      next: (c) => (this.customers = c || []),
      error: () => {}
    });
  }

  get filteredCustomers(): Customer[] {
    const q = (this.customerSearchText || '').trim().toLowerCase();
    if (!q) {
      return this.customers.slice(0, 15);
    }
    return this.customers.filter(c => {
      const name = (c.customerName || c.customername || '').toLowerCase();
      const phone = String(c.phoneno || c.mobileno || c.mobilenumber || c.phone || '');
      const addr = (c.address || c.Address || c.area || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || addr.includes(q);
    }).slice(0, 20);
  }

  selectCustomer(c: Customer) {
    this.selectedCustomer = c;
    this.customerSearchText = '';
    this.showCustomerDropdown = false;
    this.saveDraft();
    this.toastr.info(`Customer selected: ${c.customerName || c.customername}`);
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.customerSearchText = '';
    this.showCustomerDropdown = false;
    this.saveDraft();
  }

  openAddCustomerModal() {
    this.newCustomer = {
      customerName: this.customerSearchText.trim(),
      phoneno: '',
      address: '',
      area: '',
      city: 'Chennai',
      pincode: ''
    };
    this.showAddCustomerModal = true;
    this.showCustomerDropdown = false;
  }

  closeAddCustomerModal() {
    this.showAddCustomerModal = false;
  }

  saveNewCustomer() {
    if (!this.newCustomer.customerName || !this.newCustomer.customerName.trim()) {
      this.toastr.warning('Customer name is required');
      return;
    }

    const payload: Customer = {
      customerName: this.newCustomer.customerName.trim(),
      address: this.newCustomer.address.trim() || undefined,
      area: this.newCustomer.area.trim() || undefined,
      city: this.newCustomer.city.trim() || undefined,
      state: 'TAMIL NADU',
      country: 'INDIA'
    };

    const cleanPhone = (this.newCustomer.phoneno || '').replace(/\D/g, '');
    if (cleanPhone) {
      payload.phoneno = Number(cleanPhone);
      payload.mobileno = Number(cleanPhone);
    }
    if (this.newCustomer.pincode) {
      payload.pincode = Number(this.newCustomer.pincode);
    }

    this.savingCustomer = true;
    this.api.saveCustomer(payload).subscribe({
      next: (saved) => {
        this.savingCustomer = false;
        this.customers.unshift(saved);
        this.selectCustomer(saved);
        this.showAddCustomerModal = false;
        this.toastr.success(`Customer "${saved.customerName || saved.customername}" registered & selected!`);
      },
      error: (err) => {
        this.savingCustomer = false;
        console.error('Customer save error:', err);
        this.toastr.error('Failed to save customer. Please try again.');
      }
    });
  }

  loadActiveEstimates() {
    this.api.getActiveEstimates().subscribe({
      next: (ests) => (this.savedEstimates = ests),
      error: () => {}
    });
  }

  addNewItem() {
    const defaultItem: EstimateDraftItem = {
      itemName: '',
      metalType: 'GOLD',
      grossWeight: null as any,
      stoneWeight: 0,
      netWeight: 0,
      purity: 91.6,
      rate: this.goldRate,
      wastagePercent: 0,
      makingChargeType: 'PERCENT',
      makingChargeRate: 0,
      makingChargeAmount: 0,
      metalValue: 0,
      stoneAmount: 0,
      hallmarkCharge: 0,
      taxableAmount: 0,
      gstAmount: 0,
      itemTotal: 0
    };
    this.recalculateItem(defaultItem);
    this.items.push(defaultItem);
    this.saveDraft();
  }

  onMetalTypeChange(item: EstimateDraftItem) {
    if (item.metalType === 'SILVER') {
      item.rate = this.silverRate;
      if (item.purity === 91.6) item.purity = 99.9;
    } else {
      item.rate = this.goldRate;
      if (item.purity === 99.9) item.purity = 91.6;
    }
    this.recalculateItem(item);
    this.saveDraft();
  }

  assignBarcodeToItem(item: EstimateDraftItem) {
    const code = prompt('Enter barcode or tag for this item:');
    if (code && code.trim()) {
      const clean = code.trim();
      item.barcode = clean;
      this.api.getInventoryItemByBarcode(clean).subscribe({
        next: (inv) => {
          if (inv) {
            item.itemName = inv.itemName || item.itemName;
            item.designNo = inv.designNo || item.designNo;
            item.huid = inv.huid || item.huid;
            if (inv.grossweight) item.grossWeight = Number(inv.grossweight);
            if (inv.stoneweight) item.stoneWeight = Number(inv.stoneweight);
            item.netWeight = (item.grossWeight || 0) - (item.stoneWeight || 0);
            if (inv.purity) item.purity = Number(inv.purity);
            if (inv.metalType) item.metalType = inv.metalType as MetalType;
            this.recalculateItem(item);
            this.saveDraft();
            this.toastr.success(`Synced details from inventory for ${clean}`);
          }
        },
        error: () => {
          this.toastr.info(`Tagged custom barcode "${clean}" to line.`);
          this.saveDraft();
        }
      });
    }
  }

  clearItemBarcode(item: EstimateDraftItem) {
    item.barcode = undefined;
    this.saveDraft();
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
    this.saveDraft();
  }

  recalculateItem(item: EstimateDraftItem) {
    const calc = this.pricing.calculateItemPrice({
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      purity: item.purity,
      ratePerGram: item.rate,
      wastagePercent: item.wastagePercent,
      makingChargeType: item.makingChargeType,
      makingChargeRate: item.makingChargeRate,
      stoneAmount: item.stoneAmount,
      hallmarkCharges: item.hallmarkCharge
    });

    item.netWeight = calc.netWeight;
    item.metalValue = calc.metalValue;
    item.makingChargeAmount = calc.makingChargeAmount;
    item.taxableAmount = calc.taxableAmount;
    item.gstAmount = calc.gstAmount;
    item.itemTotal = calc.itemTotal;
    this.saveDraft();
  }

  recalculateAll() {
    for (const item of this.items) {
      if (item.metalType === 'SILVER') {
        item.rate = this.silverRate;
      } else {
        item.rate = this.goldRate;
      }
      this.recalculateItem(item);
    }
  }

  get grandTotal(): number {
    return Math.round(this.items.reduce((sum, i) => sum + i.itemTotal, 0));
  }

  get totalTaxable(): number {
    return this.items.reduce((sum, i) => sum + i.taxableAmount, 0);
  }

  get totalGst(): number {
    return this.items.reduce((sum, i) => sum + i.gstAmount, 0);
  }

  saveAndPrintEstimate() {
    if (this.items.length === 0) {
      this.toastr.warning('Please add at least one item');
      return;
    }

    const hasInvalid = this.items.some(i => !i.itemName?.trim() || !i.grossWeight || i.grossWeight <= 0);
    if (hasInvalid) {
      this.toastr.warning('Please enter an item name and gross weight (> 0g) for all quotation items.', 'Validation');
      return;
    }

    const estimateItems: EstimateItem[] = this.items.map(i => ({
      itemName: i.itemName,
      metalType: i.metalType || 'GOLD',
      barcodeValue: i.barcode,
      designNo: i.designNo,
      huid: i.huid,
      grossWeight: i.grossWeight,
      stoneWeight: i.stoneWeight,
      netWeight: i.netWeight,
      purity: i.purity,
      rate: i.rate,
      metalValue: i.metalValue,
      wastagePercent: i.wastagePercent,
      makingChargeType: i.makingChargeType,
      makingChargeRate: i.makingChargeRate,
      makingChargeAmount: i.makingChargeAmount,
      stoneAmount: i.stoneAmount,
      hallmarkCharge: i.hallmarkCharge,
      itemSubtotal: i.taxableAmount,
      gstPercent: 3,
      gstAmount: i.gstAmount,
      itemTotal: i.itemTotal
    }));

    const payload: Estimate = {
      customer: this.selectedCustomer || undefined,
      goldRate: this.goldRate,
      silverRate: this.silverRate,
      subtotal: this.totalTaxable,
      cgst: this.totalGst / 2,
      sgst: this.totalGst / 2,
      grandTotal: this.grandTotal,
      notes: this.notes,
      estimateItems
    };

    this.submitting = true;
    this.api.createEstimate(payload).subscribe({
      next: (created) => {
        this.submitting = false;
        this.toastr.success(`Estimate #${created.estimateNumber || created.id} saved`);
        if (!created.customer && this.selectedCustomer) {
          created.customer = this.selectedCustomer;
        }
        this.printService.printEstimate(created);
        this.loadActiveEstimates();

        // Reset form & clear draft upon successful save
        sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
        this.items = [];
        this.selectedCustomer = null;
        this.notes = '';
        this.hasRestoredDraft = false;
      },
      error: () => {
        this.submitting = false;
        this.toastr.error('Failed to save estimate');
      }
    });
  }

  previewEstimate() {
    if (this.items.length === 0) {
      this.toastr.warning('Please add at least one item to preview quotation');
      return;
    }

    const mockEstimate: Estimate = {
      id: 1,
      estimateNumber: 'QUOTATION-' + Math.floor(1000 + Math.random() * 9000),
      estimateDate: new Date().toISOString(),
      customer: this.selectedCustomer || {
        customerName: 'Walk-in Customer',
        address: 'Direct Inquiry'
      },
      goldRate: this.goldRate,
      silverRate: this.silverRate,
      subtotal: this.totalTaxable,
      cgst: this.totalGst / 2,
      sgst: this.totalGst / 2,
      grandTotal: this.grandTotal,
      notes: this.notes,
      estimateItems: this.items.map(i => ({
        itemName: i.itemName,
        metalType: i.metalType || 'GOLD',
        barcodeValue: i.barcode,
        designNo: i.designNo,
        huid: i.huid,
        grossWeight: i.grossWeight,
        stoneWeight: i.stoneWeight,
        netWeight: i.netWeight,
        purity: i.purity,
        rate: i.rate,
        wastagePercent: i.wastagePercent,
        metalValue: i.metalValue,
        makingChargeAmount: i.makingChargeAmount,
        itemTotal: i.itemTotal
      }))
    };

    this.printService.printEstimate(mockEstimate);
    this.toastr.info('Previewing quotation PDF with customer details...');
  }

  printExisting(est: Estimate) {
    this.printService.printEstimate(est);
  }

  convertToSale(est: Estimate) {
    this.toastr.info(`Converting Estimate #${est.estimateNumber || est.estimateNo || est.id} into POS...`);
    this.router.navigate(['/jewellery/pos'], {
      state: {
        fromEstimate: est
      }
    });
  }

  deleteExisting(id: number) {
    if (!confirm('Are you sure you want to delete this estimate?')) return;
    this.api.deleteEstimate(id).subscribe({
      next: () => {
        this.toastr.success('Estimate removed');
        this.loadActiveEstimates();
      }
    });
  }
}
