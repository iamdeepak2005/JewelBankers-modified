import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, timer, switchMap, takeWhile, catchError, of, map } from 'rxjs';
import { UserService } from '../user.service';

export interface CreateOrderRequest {
  amount: number;
  planName?: string;
  planDays?: number;
  userId?: number;
  username?: string;
  userEmail?: string;
  paymentType?: 'SUBSCRIPTION' | 'POS_SALE' | 'CUSTOM';
  referenceId?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  companyName: string;
  upiString: string;
  planName: string;
  planDays: number;
  status: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
  paymentMethod?: string;
}

export interface PaymentResultResponse {
  success: boolean;
  message: string;
  orderId: string;
  paymentId: string;
  status: string;
  amount: number;
  newEndDate?: string;
  daysLeft?: number;
  paidAt?: string;
}

declare let Razorpay: any;

@Injectable({
  providedIn: 'root'
})
export class RazorpayPaymentService {

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  private get apiUrl(): string {
    return this.userService.apiUrl;
  }

  private getHeaders(): { headers: HttpHeaders } {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      return {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      };
    }
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
  }

  /**
   * Request backend to create a Razorpay Order and get dynamic UPI QR string
   */
  createOrder(payload: CreateOrderRequest): Observable<CreateOrderResponse> {
    const url = `${this.apiUrl}api/payment/create-order`;
    return this.http.post<CreateOrderResponse>(url, payload, this.getHeaders());
  }

  /**
   * Send payment confirmation details to backend for signature verification & DB saving
   */
  verifyPayment(payload: VerifyPaymentRequest): Observable<PaymentResultResponse> {
    const url = `${this.apiUrl}api/payment/verify`;
    return this.http.post<PaymentResultResponse>(url, payload, this.getHeaders());
  }

  /**
   * Poll order status by orderId (used for real-time automated scanner detection)
   */
  getOrderStatus(orderId: string): Observable<PaymentResultResponse> {
    const url = `${this.apiUrl}api/payment/status/${orderId}`;
    return this.http.get<PaymentResultResponse>(url, this.getHeaders());
  }

  /**
   * Start polling every intervalMs until payment is completed or maxAttempts reached
   */
  pollPaymentStatus(orderId: string, intervalMs: number = 3000, maxAttempts: number = 100): Observable<PaymentResultResponse> {
    let attempts = 0;
    return timer(1000, intervalMs).pipe(
      switchMap(() => {
        attempts++;
        return this.getOrderStatus(orderId).pipe(
          catchError(() => of({ success: false, status: 'PENDING', message: 'Checking...', orderId, paymentId: '', amount: 0 }))
        );
      }),
      takeWhile(res => attempts < maxAttempts && res.status !== 'PAID' && res.status !== 'FAILED', true)
    );
  }

  /**
   * Open standard Razorpay Checkout Modal (supports Cards, UPI, NetBanking, Wallets)
   */
  openRazorpayCheckout(
    order: CreateOrderResponse,
    userInfo: { name?: string; email?: string; contact?: string },
    onSuccess: (paymentData: any) => void,
    onDismiss?: () => void
  ): void {
    if (typeof Razorpay === 'undefined') {
      console.warn('Razorpay SDK script not loaded yet');
      return;
    }

    const options = {
      key: order.keyId,
      amount: order.amountInPaise,
      currency: order.currency || 'INR',
      name: order.companyName || 'JewelBankers',
      description: order.planName || 'JewelBankers Subscription',
      image: 'jewelbankers_logo.ico',
      order_id: order.orderId && !order.orderId.startsWith('order_jb_') ? order.orderId : undefined,
      prefill: {
        name: userInfo.name || '',
        email: userInfo.email || '',
        contact: userInfo.contact || ''
      },
      theme: {
        color: '#d97706' // Jewel Amber
      },
      handler: (response: any) => {
        console.log('Razorpay payment response received:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log('Razorpay modal dismissed by user');
          if (onDismiss) onDismiss();
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
      });
      rzp.open();
    } catch (e) {
      console.error('Failed to open Razorpay modal:', e);
    }
  }

  /**
   * Generate dynamic QR code image URL for UPI payload
   */
  getQrCodeUrl(upiPayload: string, size: number = 240): string {
    const encoded = encodeURIComponent(upiPayload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=8&qzone=1`;
  }
}
