import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { WarningDialogComponent } from '../../../warning-dialog/warning-dialog.component';

import { JewelleryApiService } from '../../services/jewellery-api.service';
import { JewelleryPricingService, ItemPricingBreakdown } from '../../services/jewellery-pricing.service';
import { BarcodeScannerService } from '../../services/barcode-scanner.service';
import { JewelleryPrintService } from '../../services/jewellery-print.service';
import { Customer, Sales, SalesItem, PurchaseItem, MakingChargeType } from '../../models/jewellery.models';

export interface PosCartLine {
  purchaseItemId?: number;
  barcode: string;
  itemName: string;
  designNo: string;
  huid: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  purity: number;
  ratePerGram: number;
  wastagePercent: number;
  makingChargeType: MakingChargeType;
  makingChargeRate: number;
  stoneAmount: number;
  hallmarkCharges: number;
  calculated: ItemPricingBreakdown;
}

@Component({
  selector: 'app-jewellery-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css']
})
export class JewelleryPosComponent implements OnInit, OnDestroy {
  barcodeInput = '';
  cart: PosCartLine[] = [];
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  customerSearch = '';

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

  // Bullion rates
  currentGoldRate22K = 6950;
  currentGoldRate24K = 7580;
  currentSilverRate = 92;

  // Old Gold Deduction
  oldGoldAmount = 0;
  discountAmount = 0;

  // Tender Breakup
  cashAmount = 0;
  upiAmount = 0;
  cardAmount = 0;
  bankAmount = 0;
  salesman = 'Admin';
  notes = '';

  submitting = false;
  private scanSub?: Subscription;

  constructor(
    private api: JewelleryApiService,
    private pricing: JewelleryPricingService,
    private scanner: BarcodeScannerService,
    private printService: JewelleryPrintService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  openRazorpayPosScanner() {
    if (this.totals.grandTotal <= 0) {
      this.toastr.warning('Please add items to cart first.');
      return;
    }

    const payAmount = this.upiAmount > 0 ? this.upiAmount : this.totals.grandTotal;

    const dialogRef = this.dialog.open(WarningDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: {
        isNotAuthenticated: false,
        isWarning: false,
        daysLeft: 99,
        customAmount: payAmount,
        customTitle: `Jewellery Bill Payment`,
        customPlanDays: 0
      }
    });

    dialogRef.afterClosed().subscribe((isPaid) => {
      if (isPaid) {
        this.upiAmount = payAmount;
        if (this.cashAmount === payAmount || this.cashAmount === this.totals.grandTotal) {
          this.cashAmount = 0;
        }
        this.toastr.success(`Payment of ₹${payAmount} received & verified via Razorpay!`);
      }
    });
  }

  ngOnInit() {
    this.loadBullionRates();
    this.loadCustomers();

    // Listen to hardware barcode scanner
    this.scanSub = this.scanner.barcodeScanned$.subscribe(code => {
      this.scanBarcode(code);
    });

    // Check if navigated from an Estimate
    const navigationState = history.state;
    if (navigationState?.fromEstimate) {
      setTimeout(() => {
        this.loadFromEstimate(navigationState.fromEstimate);
      }, 200);
    }
  }

  loadFromEstimate(est: any) {
    if (est.customer) {
      this.selectCustomer(est.customer);
    }
    if (est.goldRate) {
      this.currentGoldRate22K = est.goldRate;
    }
    if (est.estimateItems && est.estimateItems.length > 0) {
      for (const item of est.estimateItems) {
        const grossWeight = Number(item.grossWeight) || 0;
        const stoneWeight = Number(item.stoneWeight) || 0;
        const netWeight = Number(item.netWeight) || (grossWeight - stoneWeight);
        const purity = Number(item.purity) || 91.6;
        const ratePerGram = Number(item.rate) || this.currentGoldRate22K;
        const wastagePercent = Number(item.wastagePercent) || 0;
        const makingChargeType: MakingChargeType = item.makingChargeType || 'PER_GRAM';
        const makingChargeRate = Number(item.makingChargeRate) || 0;
        const stoneAmount = Number(item.stoneAmount) || 0;
        const hallmarkCharges = Number(item.hallmarkCharge) || 0;

        const breakdown = this.pricing.calculateItemPrice({
          grossWeight,
          stoneWeight,
          purity,
          ratePerGram,
          wastagePercent,
          makingChargeType,
          makingChargeRate,
          stoneAmount,
          hallmarkCharges
        });

        this.cart.push({
          barcode: item.barcode || item.barcodeValue || '',
          itemName: item.itemName || 'Quotation Item',
          designNo: item.designNo || '',
          huid: item.huid || '',
          grossWeight,
          stoneWeight,
          netWeight,
          purity,
          ratePerGram,
          wastagePercent,
          makingChargeType,
          makingChargeRate,
          stoneAmount,
          hallmarkCharges,
          calculated: breakdown
        });
      }
      this.recalculateAll();
      this.toastr.info(`Loaded ${est.estimateItems.length} item(s) from Estimate #${est.estimateNumber || est.id}`);
    }
  }

  loadBullionRates() {
    this.api.getSettings().subscribe({
      next: (settings) => {
        if (Array.isArray(settings) && settings.length > 0) {
          const s = settings[0];
          if (s.goldrate) this.currentGoldRate22K = Number(s.goldrate);
          if (s.silverrate) this.currentSilverRate = Number(s.silverrate);
          this.currentGoldRate24K = Math.round(this.currentGoldRate22K * (24 / 22));
          this.recalculateAll();
        }
      }
    });
  }

  loadCustomers() {
    this.api.getAllCustomers().subscribe({
      next: (custs) => {
        this.customers = custs || [];
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
    this.customerSearch = c.customerName || c.customername || '';
    this.customerSearchText = '';
    this.showCustomerDropdown = false;
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.customerSearch = '';
    this.customerSearchText = '';
    this.showCustomerDropdown = false;
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
        this.toastr.success(`Customer "${saved.customerName || saved.customername}" added & selected!`);
      },
      error: (err) => {
        this.savingCustomer = false;
        console.error('Customer save error:', err);
        this.toastr.error('Failed to save customer. Please try again.');
      }
    });
  }

  onBarcodeSubmit() {
    if (!this.barcodeInput.trim()) return;
    this.scanBarcode(this.barcodeInput.trim());
    this.barcodeInput = '';
  }

  scanBarcode(code: string) {
    // Check if already in cart
    const existing = this.cart.find(c => c.barcode.toUpperCase() === code.toUpperCase());
    if (existing) {
      this.toastr.warning(`Item with barcode ${code} is already in the cart`);
      return;
    }

    this.api.getInventoryItemByBarcode(code).subscribe({
      next: (item: PurchaseItem) => {
        this.addItemToCart(item);
        this.toastr.success(`Added ${item.itemName || 'Item'} to cart`);
      },
      error: () => {
        // If not found in inventory, allow adding a manual ad-hoc line
        this.toastr.info(`Barcode ${code} not in vault. Adding manual line.`);
        this.addManualLine(code);
      }
    });
  }

  addItemToCart(item: PurchaseItem) {
    const gross = item.grossweight || item.weight || 0;
    const stone = item.stoneweight || 0;
    const rate = item.metalType === 'SILVER' ? this.currentSilverRate : this.currentGoldRate22K;
    const chargeType = item.makingChargeType || 'PERCENT';
    const chargeRate = item.makingCharge ? Number(item.makingCharge) : 10;
    const wastage = item.wastagepercent || 0;

    const breakdown = this.pricing.calculateItemPrice({
      grossWeight: gross,
      stoneWeight: stone,
      purity: item.purity || 91.6,
      ratePerGram: rate,
      wastagePercent: wastage,
      makingChargeType: chargeType,
      makingChargeRate: chargeRate,
      stoneAmount: item.stoneValue ? Number(item.stoneValue) : 0,
      hallmarkCharges: 45
    });

    this.cart.push({
      purchaseItemId: item.id,
      barcode: item.barcode?.barcodeValue || item.barcode?.tag || ('JW' + item.id),
      itemName: item.itemName || 'Gold Ornament',
      designNo: item.designNo || '',
      huid: item.huid || '',
      grossWeight: gross,
      stoneWeight: stone,
      netWeight: Math.max(0, gross - stone),
      purity: item.purity || 91.6,
      ratePerGram: rate,
      wastagePercent: wastage,
      makingChargeType: chargeType,
      makingChargeRate: chargeRate,
      stoneAmount: item.stoneValue ? Number(item.stoneValue) : 0,
      hallmarkCharges: 45,
      calculated: breakdown
    });

    this.autoTenderFill();
  }

  addManualLine(barcode: string = '') {
    const rate = this.currentGoldRate22K;
    const breakdown = this.pricing.calculateItemPrice({
      grossWeight: 5.0,
      stoneWeight: 0,
      purity: 91.6,
      ratePerGram: rate,
      wastagePercent: 0,
      makingChargeType: 'PERCENT',
      makingChargeRate: 10,
      hallmarkCharges: 45
    });

    this.cart.push({
      barcode: barcode || ('MANUAL-' + (this.cart.length + 1)),
      itemName: 'Custom Ornament',
      designNo: '',
      huid: '',
      grossWeight: 5.0,
      stoneWeight: 0,
      netWeight: 5.0,
      purity: 91.6,
      ratePerGram: rate,
      wastagePercent: 0,
      makingChargeType: 'PERCENT',
      makingChargeRate: 10,
      stoneAmount: 0,
      hallmarkCharges: 45,
      calculated: breakdown
    });

    this.autoTenderFill();
  }

  removeItem(index: number) {
    this.cart.splice(index, 1);
    this.autoTenderFill();
  }

  recalculateLine(line: PosCartLine) {
    line.calculated = this.pricing.calculateItemPrice({
      grossWeight: line.grossWeight,
      stoneWeight: line.stoneWeight,
      purity: line.purity,
      ratePerGram: line.ratePerGram,
      wastagePercent: line.wastagePercent,
      makingChargeType: line.makingChargeType,
      makingChargeRate: line.makingChargeRate,
      stoneAmount: line.stoneAmount,
      hallmarkCharges: line.hallmarkCharges
    });
    line.netWeight = line.calculated.netWeight;
    this.autoTenderFill();
  }

  recalculateAll() {
    for (const line of this.cart) {
      this.recalculateLine(line);
    }
  }

  get totals() {
    return this.pricing.calculateBillTotals(
      this.cart.map(c => c.calculated),
      this.oldGoldAmount,
      this.discountAmount
    );
  }

  autoTenderFill() {
    // By default, fill cash with grandTotal if no split is provided yet
    if (this.upiAmount === 0 && this.cardAmount === 0 && this.bankAmount === 0) {
      this.cashAmount = this.totals.grandTotal;
    }
  }



  checkout(printInvoice: boolean = true) {
    if (this.cart.length === 0) {
      this.toastr.warning('Cart is empty. Scan an item first.');
      return;
    }

    const t = this.totals;
    const totalTender = (this.cashAmount || 0) + (this.upiAmount || 0) + (this.cardAmount || 0) + (this.bankAmount || 0);

    const salesItems: SalesItem[] = this.cart.map(item => ({
      purchaseitemid: item.purchaseItemId || 0,
      barcode: item.barcode,
      huid: item.huid,
      designNo: item.designNo,
      itemName: item.itemName,
      metalType: 'GOLD',
      quantity: 1,
      grosswt: item.grossWeight,
      netwt: item.netWeight,
      purity: item.purity,
      rate: item.ratePerGram,
      wastagepercent: item.wastagePercent,
      wastagecharge: item.calculated.wastageWeight * item.ratePerGram,
      makingpercent: item.makingChargeType === 'PERCENT' ? item.makingChargeRate : 0,
      makingcharge: item.calculated.makingChargeAmount,
      hallmarkcharges: item.hallmarkCharges,
      stoneWeight: item.stoneWeight,
      stoneAmount: item.stoneAmount,
      fineWeight: item.calculated.fineWeight,
      taxableAmount: item.calculated.taxableAmount,
      gstAmount: item.calculated.gstAmount,
      amount: item.calculated.itemTotal,
      totalAmount: item.calculated.itemTotal
    }));

    const salePayload: Sales = {
      customer: this.selectedCustomer || undefined,
      salesman: this.salesman,
      billamount: t.taxableAmount,
      taxableAmount: t.taxableAmount,
      gstamount: t.totalGstAmount,
      sgstAmount: t.sgstAmount,
      cgstAmount: t.cgstAmount,
      billdiscount: this.discountAmount,
      oldGoldAmount: this.oldGoldAmount,
      roundOff: t.roundOff,
      totalamount: t.grandTotal,
      paytmentrecieved: totalTender,
      paymentbalanceamt: Math.max(0, t.grandTotal - totalTender),
      paymenttype: this.getPrimaryPaymentType(),
      cashAmount: this.cashAmount,
      upiAmount: this.upiAmount,
      cardAmount: this.cardAmount,
      bankAmount: this.bankAmount,
      notes: this.notes,
      salesItems
    };

    this.submitting = true;
    this.api.saveSale(salePayload).subscribe({
      next: (savedSale) => {
        this.submitting = false;
        this.toastr.success(`Invoice ${savedSale.invoiceNumber || savedSale.billno} generated successfully!`);

        const customerHasPhone = !!(
          savedSale.customer?.phoneno ||
          savedSale.customer?.mobileno ||
          this.selectedCustomer?.phoneno ||
          this.selectedCustomer?.mobileno
        );
        if (customerHasPhone) {
          this.toastr.info('📲 WhatsApp purchase receipt dispatched to customer!');
        }

        if (printInvoice) {
          if (!savedSale.customer && this.selectedCustomer) {
            savedSale.customer = this.selectedCustomer;
          }
          this.printService.printTaxInvoice(savedSale);
        }

        // Reset cart for next customer
        this.cart = [];
        this.oldGoldAmount = 0;
        this.discountAmount = 0;
        this.cashAmount = 0;
        this.upiAmount = 0;
        this.cardAmount = 0;
        this.bankAmount = 0;
        this.notes = '';
      },
      error: (err) => {
        this.submitting = false;
        this.toastr.error('Failed to complete transaction. Check backend connection.');
        console.error('POS Checkout error', err);
      }
    });
  }

  getPrimaryPaymentType(): string {
    if (this.upiAmount > 0 && this.cashAmount === 0) return 'UPI';
    if (this.cardAmount > 0 && this.cashAmount === 0) return 'CARD';
    if (this.bankAmount > 0 && this.cashAmount === 0) return 'BANK';
    if (this.cashAmount > 0 && (this.upiAmount > 0 || this.cardAmount > 0)) return 'SPLIT';
    return 'CASH';
  }

  previewInvoice() {
    if (this.cart.length === 0) {
      this.toastr.warning('Please add at least one item to preview invoice PDF');
      return;
    }
    const t = this.totals;
    const mockSale: Sales = {
      invoiceNumber: 'PREVIEW-' + Math.floor(1000 + Math.random() * 9000),
      billno: 1,
      billdate: new Date().toISOString(),
      customer: this.selectedCustomer || { customerName: 'Walk-in Customer', mobilenumber: '9876543210' },
      salesman: this.salesman || 'Deepak',
      taxableAmount: t.taxableAmount,
      cgstAmount: t.cgstAmount,
      sgstAmount: t.sgstAmount,
      gstamount: t.totalGstAmount,
      oldGoldAmount: this.oldGoldAmount,
      billdiscount: this.discountAmount,
      totalamount: t.grandTotal,
      cashAmount: this.cashAmount,
      upiAmount: this.upiAmount,
      cardAmount: this.cardAmount,
      bankAmount: this.bankAmount,
      salesItems: this.cart.map((line, idx) => ({
        id: idx + 1,
        itemName: line.itemName,
        designNo: line.designNo,
        huid: line.huid,
        grosswt: line.grossWeight,
        netwt: line.netWeight,
        purity: line.purity,
        rate: line.ratePerGram,
        makingcharge: line.calculated.makingChargeAmount,
        totalAmount: line.calculated.itemTotal
      }))
    };
    this.printService.printTaxInvoice(mockSale);
  }

  ngOnDestroy() {
    this.scanSub?.unsubscribe();
  }
}
