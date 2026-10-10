import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BarcodeScannerService implements OnDestroy {
  private barcodeSubject = new Subject<string>();
  private buffer = '';
  private lastKeyTime = 0;
  private readonly SCAN_THRESHOLD_MS = 50; // Hardware scanners type fast (< 50ms between keys)
  private listener: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.initKeyboardListener();
  }

  get barcodeScanned$(): Observable<string> {
    return this.barcodeSubject.asObservable();
  }

  private initKeyboardListener() {
    if (typeof window === 'undefined') return;

    this.listener = (event: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - this.lastKeyTime;
      this.lastKeyTime = now;

      // Ignore standard input when user is typing in a textarea or text input
      const target = event.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (event.key === 'Enter') {
        if (this.buffer.length >= 4) {
          // Hardware scanner completed scan
          this.barcodeSubject.next(this.buffer.trim());
          if (!isInput) {
            event.preventDefault();
          }
        }
        this.buffer = '';
        return;
      }

      if (event.key.length === 1) {
        if (timeDiff > this.SCAN_THRESHOLD_MS && this.buffer.length > 0) {
          // Reset buffer if delay too long (manual user typing)
          this.buffer = '';
        }
        this.buffer += event.key;
      }
    };

    window.addEventListener('keydown', this.listener, true);
  }

  /**
   * Manually emit barcode (e.g. from on-screen search input)
   */
  emitBarcode(code: string) {
    if (code && code.trim()) {
      this.barcodeSubject.next(code.trim());
    }
  }

  ngOnDestroy() {
    if (this.listener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.listener, true);
    }
  }
}
