import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import {
  PurchaseItem,
  Purchase,
  Sales,
  Estimate,
  OldGold,
  Barcode,
  InventoryMovement,
  DashboardMetrics,
  Customer,
  Supplier,
  ItemStatus,
  MetalType
} from '../models/jewellery.models';

@Injectable({
  providedIn: 'root'
})
export class JewelleryApiService {
  public apiUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      this.apiUrl = 'http://localhost:8081/jewelbankersapi/';
    } else if (typeof window !== 'undefined') {
      this.apiUrl = window.location.origin + '/jewelbankersapi/';
    } else {
      this.apiUrl = 'http://localhost:8081/jewelbankersapi/';
    }
  }

  // --- Dashboard ---
  getDashboardMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.apiUrl}jewellery/dashboard`);
  }

  // --- Inventory & Items ---
  getInventory(params?: {
    status?: ItemStatus;
    metalType?: MetalType;
    category?: string;
    search?: string;
  }): Observable<PurchaseItem[]> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.metalType) httpParams = httpParams.set('metalType', params.metalType);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<PurchaseItem[]>(`${this.apiUrl}inventory/items`, { params: httpParams });
  }

  getInventoryItemById(id: number): Observable<PurchaseItem> {
    return this.http.get<PurchaseItem>(`${this.apiUrl}inventory/items/${id}`);
  }

  getInventoryItemByBarcode(barcodeValue: string): Observable<PurchaseItem> {
    return this.http.get<PurchaseItem>(`${this.apiUrl}inventory/items/barcode/${encodeURIComponent(barcodeValue)}`);
  }

  updateItemStatus(id: number, status: ItemStatus, reason?: string, performedBy?: string): Observable<PurchaseItem> {
    return this.http.put<PurchaseItem>(`${this.apiUrl}inventory/items/${id}/status`, {
      status,
      reason: reason || 'Status updated via Inventory',
      performedBy: performedBy || 'USER'
    });
  }

  updateItemLocation(id: number, location: { counter?: string; tray?: string; rack?: string }): Observable<PurchaseItem> {
    return this.http.put<PurchaseItem>(`${this.apiUrl}inventory/items/${id}/location`, location);
  }

  getItemMovements(itemId: number): Observable<InventoryMovement[]> {
    return this.http.get<InventoryMovement[]>(`${this.apiUrl}inventory/movements/${itemId}`);
  }

  getInventoryStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}inventory/stats`);
  }

  // --- Barcode Infrastructure ---
  lookupBarcode(barcodeValue: string): Observable<Barcode> {
    return this.http.get<Barcode>(`${this.apiUrl}barcodes/lookup/${encodeURIComponent(barcodeValue)}`);
  }

  getBarcodeImageUrl(barcodeValue: string): string {
    return `${this.apiUrl}barcodes/image/${encodeURIComponent(barcodeValue)}`;
  }

  generateBarcodeForItem(purchaseItemId: number): Observable<Barcode> {
    return this.http.post<Barcode>(`${this.apiUrl}barcodes/generate/${purchaseItemId}`, {});
  }

  markBarcodePrinted(barcodeValue: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}barcodes/mark-printed/${encodeURIComponent(barcodeValue)}`, {});
  }

  voidBarcode(barcodeValue: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}barcodes/void/${encodeURIComponent(barcodeValue)}`, {});
  }

  // --- Purchase / Stock Inward ---
  savePurchase(purchase: Purchase): Observable<Purchase> {
    return this.http.post<Purchase>(`${this.apiUrl}purchases/savePurchase`, purchase);
  }

  getAllPurchases(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.apiUrl}purchases/allPurchases`);
  }

  getPurchaseById(id: number): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.apiUrl}purchases/${id}`);
  }

  // --- Sales POS ---
  saveSale(sale: Sales): Observable<Sales> {
    return this.http.post<Sales>(`${this.apiUrl}sales/saveSales`, sale);
  }

  getAllSales(): Observable<Sales[]> {
    return this.http.get<Sales[]>(`${this.apiUrl}sales/allSales`);
  }

  getSaleById(id: number): Observable<Sales> {
    return this.http.get<Sales>(`${this.apiUrl}sales/${id}`);
  }

  sendSaleWhatsAppReceipt(saleId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}whatsapp/send-sale/${saleId}`, {});
  }

  // --- Rough Estimates ---
  createEstimate(estimate: Estimate): Observable<Estimate> {
    return this.http.post<Estimate>(`${this.apiUrl}estimates`, estimate);
  }

  getActiveEstimates(): Observable<Estimate[]> {
    return this.http.get<Estimate[]>(`${this.apiUrl}estimates/active`);
  }

  getAllEstimates(): Observable<Estimate[]> {
    return this.http.get<Estimate[]>(`${this.apiUrl}estimates/all`);
  }

  getEstimateById(id: number): Observable<Estimate> {
    return this.http.get<Estimate>(`${this.apiUrl}estimates/${id}`);
  }

  convertEstimateToSale(estimateId: number, salesId: number): Observable<Estimate> {
    return this.http.post<Estimate>(`${this.apiUrl}estimates/${estimateId}/convert?salesId=${salesId}`, {});
  }

  deleteEstimate(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}estimates/${id}`);
  }

  // --- Old Gold / Trade-ins ---
  createOldGold(oldGold: OldGold): Observable<OldGold> {
    return this.http.post<OldGold>(`${this.apiUrl}old-gold`, oldGold);
  }

  getAllOldGold(): Observable<OldGold[]> {
    return this.http.get<OldGold[]>(`${this.apiUrl}old-gold/all`);
  }

  getOldGoldById(id: number): Observable<OldGold> {
    return this.http.get<OldGold>(`${this.apiUrl}old-gold/${id}`);
  }

  deleteOldGold(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}old-gold/${id}`);
  }

  // --- Customer & Supplier lookups ---
  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}customers/allCustomers`).pipe(
      catchError(() => of([]))
    );
  }

  searchCustomersFuzzy(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}customers/fuzzy`, {
      params: { query }
    }).pipe(
      catchError(() => of([]))
    );
  }

  saveCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}customers/saveCustomer`, customer);
  }

  getAllSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.apiUrl}suppliers`).pipe(
      catchError(() => of([]))
    );
  }

  createSupplier(supplier: Partial<Supplier>): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}suppliers`, supplier);
  }

  // --- Live Rates from Settings ---
  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}settings/all`).pipe(
      catchError(() => of([]))
    );
  }
}
