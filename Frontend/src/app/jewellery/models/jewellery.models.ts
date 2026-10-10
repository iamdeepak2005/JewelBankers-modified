export type MetalType = 'GOLD' | 'SILVER' | 'PLATINUM' | 'OTHER';

export type ItemStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'SOLD'
  | 'RETURNED'
  | 'EXCHANGED'
  | 'DAMAGED'
  | 'MELTED'
  | 'TRANSFERRED'
  | 'LOST'
  | 'HOLD';

export type MakingChargeType = 'FLAT' | 'PERCENT' | 'PER_GRAM';

export type EstimateStatus = 'DRAFT' | 'ACTIVE' | 'CONVERTED' | 'EXPIRED' | 'CANCELLED';

export type SaleStatus = 'COMPLETED' | 'RETURNED' | 'HOLD' | 'CANCELLED';

export interface Customer {
  customerid?: number;
  id?: number;
  customerName?: string;
  customername?: string;
  phoneno?: number | string;
  mobileno?: number | string;
  mobilenumber?: string;
  mobileNumber?: string;
  phone?: string;
  address?: string;
  Address?: string;
  fullAddress?: string;
  street?: string;
  area?: string;
  district?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: number | string;
  email?: string;
  mailid?: string;
  pan?: string;
  aadhaar?: string;
}

export interface Supplier {
  id?: number;
  suppliername?: string;
  supplierName?: string;
  phonenumber?: string;
  phoneNumber?: string;
  mobile?: string;
  email?: string;
  address?: string;
  gstnumber?: string;
  gstNumber?: string;
  gstno?: string;
}

export interface Barcode {
  id?: number;
  tag?: string;
  barcodeValue?: string;
  barcodedatetime?: string;
  status?: string;
  printCount?: number;
  generatedBy?: string;
}

export interface PurchaseItem {
  id?: number;
  purchaseid?: number;
  itemid?: number;
  barcode?: Barcode;
  itemStatus?: ItemStatus;
  status?: string;
  metalType?: MetalType;
  category?: string;
  itemName?: string;
  designNo?: string;
  huid?: string;
  sku?: string;
  grossweight?: number;
  netWeight?: number;
  weight?: number; // legacy weight
  stoneweight?: number;
  purity?: number;
  fineWeight?: number;
  wastagepercent?: number;
  wastageWeight?: number;
  rate?: number;
  makingCharge?: number;
  makingChargeType?: MakingChargeType;
  stoneCount?: number;
  stoneValue?: number;
  stoneDetails?: string;
  location?: string;
  rack?: string;
  tray?: string;
  counter?: string;
  amount?: number;
  totalamount?: number;
  quantity?: number;
  imagePath?: string;
}

export interface Purchase {
  id?: number;
  invoiceno?: number;
  invoiceprefix?: string;
  invoicedatetime?: string;
  supplier?: Supplier;
  paymenttype?: string;
  comments?: string;
  gstamount?: number;
  discount?: number;
  totalamount?: number;
  status?: string;
  purchaseItems?: PurchaseItem[];
}

export interface SalesItem {
  id?: number;
  itemid?: number;
  purchaseitemid?: number;
  barcode?: string;
  huid?: string;
  designNo?: string;
  itemName?: string;
  metalType?: MetalType;
  quantity?: number;
  grosswt?: number;
  netwt?: number;
  purity?: number;
  rate?: number;
  wastagepercent?: number;
  wastagecharge?: number;
  makingpercent?: number;
  makingcharge?: number;
  makingChargeType?: MakingChargeType;
  hallmarkcharges?: number;
  stoneWeight?: number;
  stoneAmount?: number;
  fineWeight?: number;
  taxableAmount?: number;
  gstAmount?: number;
  amount?: number;
  totalAmount?: number;
}

export interface Sales {
  id?: number;
  billno?: number;
  invoiceNumber?: string;
  billprefix?: string;
  billdate?: string;
  customer?: Customer;
  salesman?: string;
  paymenttype?: string;
  paymentsubtype?: string;
  paymentrefno?: string;
  billamount?: number;
  gstamount?: number;
  billdiscount?: number;
  totalamount?: number;
  paytmentrecieved?: number;
  paymentbalanceamt?: number;
  status?: SaleStatus;
  oldGoldAmount?: number;
  roundOff?: number;
  notes?: string;
  subTotal?: number;
  taxableAmount?: number;
  sgstAmount?: number;
  cgstAmount?: number;
  igstAmount?: number;
  cashAmount?: number;
  cardAmount?: number;
  upiAmount?: number;
  bankAmount?: number;
  salesItems?: SalesItem[];
}

export interface EstimateItem {
  id?: number;
  metalType?: MetalType;
  itemName?: string;
  grossWeight?: number;
  stoneWeight?: number;
  netWeight?: number;
  purity?: number;
  rate?: number;
  metalValue?: number;
  wastagePercent?: number;
  wastageWeight?: number;
  wastageAmount?: number;
  makingChargeType?: MakingChargeType;
  makingChargeRate?: number;
  makingChargeAmount?: number;
  stoneAmount?: number;
  hallmarkCharge?: number;
  itemSubtotal?: number;
  gstPercent?: number;
  gstAmount?: number;
  itemTotal?: number;
  huid?: string;
  designNo?: string;
  barcodeValue?: string;
}

export interface Estimate {
  id?: number;
  estimateNo?: number;
  estimateNumber?: string;
  estimateDate?: string;
  validUntil?: string;
  customer?: Customer;
  salesman?: string;
  goldRate?: number;
  silverRate?: number;
  subtotal?: number;
  makingChargesTotal?: number;
  wastageTotal?: number;
  stoneChargesTotal?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  discount?: number;
  roundOff?: number;
  grandTotal?: number;
  status?: EstimateStatus;
  notes?: string;
  convertedSaleId?: number;
  estimateItems?: EstimateItem[];
}

export interface OldGold {
  id?: number;
  customer?: Customer;
  saleId?: number;
  receiptNumber?: string;
  receiptDate?: string;
  metalType?: MetalType;
  itemDescription?: string;
  grossWeight?: number;
  dustDeduction?: number;
  stoneDeduction?: number;
  waxDeduction?: number;
  netWeight?: number;
  declaredPurity?: number;
  testedPurity?: number;
  fineWeight?: number;
  marketRate?: number;
  evaluatedRate?: number;
  totalValue?: number;
  status?: string;
  notes?: string;
}

export interface InventoryMovement {
  id?: number;
  purchaseItemId?: number;
  action?: string;
  oldStatus?: ItemStatus;
  newStatus?: ItemStatus;
  referenceType?: string;
  referenceId?: number;
  fromLocation?: string;
  toLocation?: string;
  userName?: string;
  timestamp?: string;
  notes?: string;
}

export interface DashboardMetrics {
  totalStockCount: number;
  totalGoldWeightGrams: number;
  totalSilverWeightGrams: number;
  totalStockValue: number;
  todaySalesCount: number;
  todaySalesAmount: number;
  totalSalesCount: number;
  totalSalesAmount: number;
  activeEstimatesCount: number;
  oldGoldExchangesCount: number;
  totalPurchasesCount: number;
  recentSales: Array<{
    id: number;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    billDate: string;
    status: string;
  }>;
}
