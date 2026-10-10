import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPricingService } from '../../services/jewellery-pricing.service';
import { OldGold, Customer, MetalType } from '../../models/jewellery.models';

@Component({
  selector: 'app-jewellery-old-gold',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './old-gold.component.html',
  styleUrls: ['./old-gold.component.css']
})
export class JewelleryOldGoldComponent implements OnInit, OnDestroy {
  private readonly DRAFT_STORAGE_KEY = 'jewel_old_gold_draft';
  hasRestoredDraft = false;

  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  selectedCustomerIndex = '-1';
  customerSearchText = '';
  showCustomerDropdown = false;
  records: OldGold[] = [];

  // Quick Add Customer state
  showAddCustomerModal = false;
  savingCustomer = false;
  newCustomer = {
    customerName: '',
    phoneno: '',
    address: '',
    area: '',
    city: 'Chennai',
    pincode: ''
  };

  // Form Fields - Clean initial values (No fake pre-added weights)
  metalType: MetalType = 'GOLD';
  itemDescription = 'Old Gold Jewellery';
  grossWeight: number | null = null;
  dustDeduction: number = 0;
  stoneDeduction: number = 0;
  waxDeduction: number = 0;
  declaredPurity: number = 91.6;
  testedPurity: number = 91.6;
  marketRate = 7580; // 24K pure gold rate /g
  notes = '';
  submitting = false;

  constructor(
    private api: JewelleryApiService,
    private pricing: JewelleryPricingService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadRates();
    this.loadCustomers();
    this.loadRecords();

    // Check for user's unsaved draft from a previous navigation
    const rawDraft = sessionStorage.getItem(this.DRAFT_STORAGE_KEY);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        if (draft.grossWeight || draft.itemDescription || draft.selectedCustomer) {
          if (draft.itemDescription) this.itemDescription = draft.itemDescription;
          if (draft.grossWeight) this.grossWeight = draft.grossWeight;
          if (draft.dustDeduction !== undefined) this.dustDeduction = draft.dustDeduction;
          if (draft.stoneDeduction !== undefined) this.stoneDeduction = draft.stoneDeduction;
          if (draft.waxDeduction !== undefined) this.waxDeduction = draft.waxDeduction;
          if (draft.declaredPurity !== undefined) this.declaredPurity = draft.declaredPurity;
          if (draft.testedPurity !== undefined) this.testedPurity = draft.testedPurity;
          if (draft.notes) this.notes = draft.notes;
          if (draft.selectedCustomer) this.selectedCustomer = draft.selectedCustomer;
          this.hasRestoredDraft = true;
          this.toastr.info('Restored your unsaved old gold evaluation draft.', 'Draft Restored');
        }
      } catch {}
    }
  }

  ngOnDestroy() {
    this.saveDraft();
  }

  saveDraft() {
    if ((this.grossWeight && this.grossWeight > 0) || (this.itemDescription && this.itemDescription !== 'Old Gold Jewellery') || this.selectedCustomer) {
      const draft = {
        itemDescription: this.itemDescription,
        grossWeight: this.grossWeight,
        dustDeduction: this.dustDeduction,
        stoneDeduction: this.stoneDeduction,
        waxDeduction: this.waxDeduction,
        declaredPurity: this.declaredPurity,
        testedPurity: this.testedPurity,
        notes: this.notes,
        selectedCustomer: this.selectedCustomer
      };
      sessionStorage.setItem(this.DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } else {
      sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
    }
  }

  clearDraft() {
    sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
    this.itemDescription = 'Old Gold Jewellery';
    this.grossWeight = null;
    this.dustDeduction = 0;
    this.stoneDeduction = 0;
    this.waxDeduction = 0;
    this.notes = '';
    this.selectedCustomer = null;
    this.selectedCustomerIndex = '-1';
    this.hasRestoredDraft = false;
    this.toastr.info('Cleared calculator fields.', 'Reset');
  }

  loadRates() {
    this.api.getSettings().subscribe({
      next: (settings) => {
        if (Array.isArray(settings) && settings.length > 0 && settings[0].goldrate) {
          const rate22k = Number(settings[0].goldrate);
          this.marketRate = Math.round(rate22k * (24 / 22));
        }
      }
    });
  }

  loadCustomers() {
    this.api.getAllCustomers().subscribe({
      next: (c) => {
        this.customers = Array.isArray(c) ? c : [];
        if (this.selectedCustomer) {
          const idx = this.customers.findIndex(item => item.id === this.selectedCustomer?.id);
          this.selectedCustomerIndex = idx >= 0 ? String(idx) : '-1';
        }
      },
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

  selectWalkIn() {
    this.selectedCustomer = null;
    this.customerSearchText = '';
    this.showCustomerDropdown = false;
    this.saveDraft();
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
      this.toastr.warning('Please enter Customer Name (Compulsory)', 'Validation');
      return;
    }

    const payload: Customer = {
      customerName: this.newCustomer.customerName.trim(),
      address: this.newCustomer.address?.trim() || undefined,
      area: this.newCustomer.area?.trim() || undefined,
      city: this.newCustomer.city?.trim() || undefined,
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
      next: (saved: any) => {
        this.savingCustomer = false;
        const normalized: Customer = typeof saved === 'object' && saved ? saved : {
          ...payload,
          id: Date.now()
        };

        this.customers.unshift(normalized);
        this.selectedCustomer = normalized;
        this.selectedCustomerIndex = '0';
        this.showAddCustomerModal = false;
        this.saveDraft();
        this.toastr.success(`Customer "${normalized.customerName || normalized.customername}" added & selected!`, 'Success');
      },
      error: (err) => {
        this.savingCustomer = false;
        console.error('Customer save error', err);
        this.toastr.error('Failed to save customer. Please try again.', 'Error');
      }
    });
  }

  loadRecords() {
    this.api.getAllOldGold().subscribe({
      next: (data) => (this.records = Array.isArray(data) ? data : []),
      error: () => {}
    });
  }

  get calculation() {
    return this.pricing.calculateOldGold({
      grossWeight: Number(this.grossWeight) || 0,
      dustDeduction: this.dustDeduction,
      stoneDeduction: this.stoneDeduction,
      waxDeduction: this.waxDeduction,
      testedPurity: this.testedPurity,
      marketRate: this.marketRate
    });
  }

  saveExchange() {
    if (!this.grossWeight || Number(this.grossWeight) <= 0) {
      this.toastr.warning('Please enter valid Gross Scale Weight (> 0g)', 'Validation');
      return;
    }

    const calc = this.calculation;
    const payload: OldGold = {
      customer: this.selectedCustomer || undefined,
      metalType: this.metalType,
      itemDescription: this.itemDescription || 'Old Gold Jewellery',
      grossWeight: calc.grossWeight,
      dustDeduction: this.dustDeduction,
      stoneDeduction: this.stoneDeduction,
      waxDeduction: this.waxDeduction,
      netWeight: calc.netWeight,
      declaredPurity: this.declaredPurity,
      testedPurity: calc.purity,
      fineWeight: calc.fineWeight,
      marketRate: calc.ratePerGram,
      totalValue: calc.totalValue,
      status: 'RECEIVED',
      notes: this.notes
    };

    this.submitting = true;
    this.api.createOldGold(payload).subscribe({
      next: (saved) => {
        this.submitting = false;
        this.toastr.success(`Old Gold receipt saved. Total Value: ₹${Math.round(saved.totalValue || 0)}`);
        this.loadRecords();

        // Reset state and clear storage draft
        sessionStorage.removeItem(this.DRAFT_STORAGE_KEY);
        this.grossWeight = null;
        this.dustDeduction = 0;
        this.stoneDeduction = 0;
        this.waxDeduction = 0;
        this.notes = '';
        this.itemDescription = 'Old Gold Jewellery';
        this.selectedCustomer = null;
        this.selectedCustomerIndex = '-1';
        this.hasRestoredDraft = false;
      },
      error: () => {
        this.submitting = false;
        this.toastr.error('Failed to save old gold exchange');
      }
    });
  }

  deleteRecord(id: number) {
    if (!confirm('Are you sure you want to delete this old gold record?')) return;
    this.api.deleteOldGold(id).subscribe({
      next: () => {
        this.toastr.success('Record deleted');
        this.loadRecords();
      }
    });
  }
}
