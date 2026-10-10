import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sales, Estimate, PurchaseItem } from '../models/jewellery.models';

@Injectable({
  providedIn: 'root'
})
export class JewelleryPrintService {

  // Code128-B Pattern table (107 patterns: 0..102 data, 103..105 start, 106 stop)
  private readonly CODE128_PATTERNS = [
    "212222","222122","222221","121223","121322","131222","122213","122312","132212","221213",
    "221312","231212","112232","122132","122231","113222","123122","123221","223211","221132",
    "221231","213212","223112","312131","311222","321122","321221","312212","322112","322211",
    "212123","212321","232121","111323","131123","131321","112313","132113","132311","211313",
    "231113","231311","112133","112331","132131","113123","113321","133121","313121","211331",
    "231131","213113","213311","213131","311123","311321","331121","312113","312311","332111",
    "314111","221411","431111","111224","111422","121124","121421","141122","141221","112214",
    "112412","122114","122411","142112","142211","241211","221114","413111","241112","134111",
    "111242","121142","121241","114212","124112","124211","411212","421112","421211","212141",
    "214121","412121","111143","111341","131141","114113","114311","411113","411311","113141",
    "114131","311141","411131","211412","211214","211232","2331112"
  ];

  /**
   * Draws vector Code128 scannable barcode onto jsPDF canvas
   */
  private drawCode128Barcode(doc: jsPDF, text: string, y: number, height: number = 5.5, maxWidth: number = 44) {
    const cleanText = (text || '').trim();
    if (!cleanText) return;

    const START_B = 104;
    const STOP = 106;
    const codes: number[] = [START_B];
    let checksum = START_B;

    for (let i = 0; i < cleanText.length; i++) {
      const code = cleanText.charCodeAt(i) - 32;
      if (code >= 0 && code <= 95) {
        codes.push(code);
        checksum += code * (i + 1);
      }
    }

    codes.push(checksum % 103);
    codes.push(STOP);

    // Calculate total module width
    let totalModules = 0;
    for (const c of codes) {
      const pattern = this.CODE128_PATTERNS[c];
      if (pattern) {
        for (let j = 0; j < pattern.length; j++) {
          totalModules += parseInt(pattern[j], 10);
        }
      }
    }

    if (totalModules <= 0) return;

    // Determine module width (capped to ensure fit on 50mm label)
    const moduleWidth = Math.min(0.28, maxWidth / totalModules);
    const totalBarcodeWidth = totalModules * moduleWidth;
    let currentX = (50 - totalBarcodeWidth) / 2; // Center horizontally on 50mm label

    doc.setFillColor(0, 0, 0);

    for (const c of codes) {
      const pattern = this.CODE128_PATTERNS[c];
      if (!pattern) continue;

      for (let j = 0; j < pattern.length; j++) {
        const barWidth = parseInt(pattern[j], 10) * moduleWidth;
        if (j % 2 === 0) {
          // Even index = Bar (black)
          doc.rect(currentX, y, barWidth, height, 'F');
        }
        // Odd index = Space (white / transparent)
        currentX += barWidth;
      }
    }
  }

  /**
   * Prints 50mm x 25mm Thermal Barcode Jewellery Label
   */
  printBarcodeLabel(item: PurchaseItem, shopName: string = 'JEWELBANKERS') {
    // 50mm x 25mm thermal label
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [50, 25]
    });

    const barcodeVal = item.barcode?.barcodeValue || item.barcode?.tag || 'JW' + (item.id || '00001');
    const name = (item.itemName || 'ORNAMENT').substring(0, 20);
    const gross = (item.grossweight || item.weight || 0).toFixed(3) + 'g';
    const net = (item.netWeight || item.weight || 0).toFixed(3) + 'g';
    const purity = (item.purity || 91.6).toFixed(1) + '%';
    const huid = item.huid ? 'HUID: ' + item.huid : '';

    // Shop Name Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(shopName, 25, 3.8, { align: 'center' });

    // Item Name
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text(name, 25, 7.2, { align: 'center' });

    // Details Row 1: Gross & Net Weight
    doc.setFontSize(6);
    doc.text(`Gr: ${gross}`, 3, 10.5);
    doc.text(`Net: ${net}`, 27, 10.5);

    // Details Row 2: Purity & HUID
    doc.text(`Pur: ${purity}`, 3, 13.8);
    if (huid) {
      doc.text(huid, 27, 13.8);
    }

    // Render Scannable Vector Code128 Barcode
    this.drawCode128Barcode(doc, barcodeVal, 15, 5.2, 44);

    // Human-readable barcode number below the barcode
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.text(barcodeVal, 25, 23.2, { align: 'center' });

    this.dispatchPrint(doc, `Barcode_${barcodeVal}.pdf`);
  }

  /**
   * Generates and prints GST Tax Invoice (A4/A5)
   */
  printTaxInvoice(sale: Sales, shopDetails?: {
    name?: string;
    address?: string;
    phone?: string;
    gstin?: string;
  }) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const shop = {
      name: shopDetails?.name || 'JEWELBANKERS JEWELLERY',
      address: shopDetails?.address || 'Main Road, Jewellery Bazar',
      phone: shopDetails?.phone || '+91 98765 43210',
      gstin: shopDetails?.gstin || '33AAAAA0000A1Z5'
    };

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(shop.name, 105, 15, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(shop.address + ' | Tel: ' + shop.phone, 105, 21, { align: 'center' });
    doc.text('GSTIN: ' + shop.gstin, 105, 26, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TAX INVOICE', 105, 33, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 36, 196, 36);

    // Invoice Meta
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Invoice No: ${sale.invoiceNumber || ('INV-' + sale.billno)}`, 14, 42);
    doc.text(`Date: ${sale.billdate ? new Date(sale.billdate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`, 14, 47);
    doc.text(`Salesman: ${sale.salesman || 'Admin'}`, 14, 52);
    if (sale.paymenttype) {
      doc.text(`Payment: ${sale.paymenttype}`, 14, 57);
    }

    // Customer / Billed To Details (Right side)
    const custInfo = this.getCustomerInfo(sale.customer);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('BILLED TO / CUSTOMER:', 115, 42);
    doc.text(custInfo.name, 115, 47);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let custY = 52;
    if (custInfo.phone && custInfo.phone !== '0') {
      doc.text(`Mobile: ${custInfo.phone}`, 115, custY);
      custY += 4.5;
    }
    if (custInfo.address) {
      const addrCombined = custInfo.location ? `${custInfo.address}, ${custInfo.location}` : custInfo.address;
      const addrLines = doc.splitTextToSize(`Address: ${addrCombined}`, 80);
      doc.text(addrLines, 115, custY);
      custY += (addrLines.length * 4);
    } else if (custInfo.location) {
      doc.text(`Location: ${custInfo.location}`, 115, custY);
      custY += 4.5;
    }

    // Items Table
    const tableStartY = Math.max(63, custY + 3);
    const tableBody = (sale.salesItems || []).map((item, index) => [
      index + 1,
      item.itemName || item.designNo || 'Ornament',
      item.huid || '-',
      (item.grosswt || 0).toFixed(3),
      (item.netwt || 0).toFixed(3),
      (item.purity || 91.6).toFixed(1) + '%',
      '₹' + (item.rate || 0).toFixed(2),
      '₹' + (item.makingcharge || 0).toFixed(2),
      '₹' + (item.amount || item.totalAmount || 0).toFixed(2)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Description', 'HUID', 'Gross (g)', 'Net (g)', 'Purity', 'Rate/g', 'Making', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // Totals Box
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Taxable Amount: ₹${(sale.taxableAmount || sale.billamount || 0).toFixed(2)}`, 140, finalY);
    doc.text(`SGST (1.5%): ₹${(sale.sgstAmount || (sale.gstamount ? sale.gstamount / 2 : 0)).toFixed(2)}`, 140, finalY + 5);
    doc.text(`CGST (1.5%): ₹${(sale.cgstAmount || (sale.gstamount ? sale.gstamount / 2 : 0)).toFixed(2)}`, 140, finalY + 10);

    if (sale.oldGoldAmount && sale.oldGoldAmount > 0) {
      doc.text(`Old Gold Exchange: - ₹${sale.oldGoldAmount.toFixed(2)}`, 140, finalY + 15);
    }
    if (sale.billdiscount && sale.billdiscount > 0) {
      doc.text(`Discount: - ₹${sale.billdiscount.toFixed(2)}`, 140, finalY + 20);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Grand Total: ₹${(sale.totalamount || 0).toFixed(2)}`, 140, finalY + 27);

    // Terms & Conditions
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text('Terms & Conditions:', 14, finalY + 38);
    doc.text('1. Gold ornaments sold are 916 HUID Hallmarked conforming to BIS standards.', 14, finalY + 43);
    doc.text('2. Items returned or exchanged will be evaluated on the day’s current bullion rate.', 14, finalY + 47);
    doc.text('3. Subject to jurisdiction of local courts only.', 14, finalY + 51);

    // Signature placeholders
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Customer Signature', 14, finalY + 68);
    doc.text('For ' + shop.name, 140, finalY + 68);

    const fileName = `Invoice_${sale.invoiceNumber || sale.billno || 'BILL'}.pdf`;
    this.dispatchPrint(doc, fileName);
  }

  /**
   * Generates and prints Rough Estimate / Quotation
   */
  printEstimate(estimate: Estimate, shopName: string = 'JEWELBANKERS') {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Watermark
    doc.setFontSize(60);
    doc.setTextColor(230, 230, 230);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTIMATE ONLY', 105, 140, { align: 'center', angle: 45 });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(shopName, 105, 18, { align: 'center' });

    doc.setFontSize(11);
    doc.text('ROUGH ESTIMATE / QUOTATION', 105, 26, { align: 'center' });
    doc.setFontSize(8);
    doc.text('(Not a Tax Invoice — Rates valid for 7 days)', 105, 31, { align: 'center' });

    doc.line(14, 34, 196, 34);

    // Estimate Meta (Left side)
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estimate #: ${estimate.estimateNumber || estimate.estimateNo || estimate.id || 'QUOTATION'}`, 14, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 45);
    doc.text(`Gold Rate (22K): ₹${estimate.goldRate || '-'} /g`, 14, 50);
    if (estimate.silverRate) {
      doc.text(`Silver Rate: ₹${estimate.silverRate} /g`, 14, 55);
    }

    // Customer Details (Right side)
    const custInfo = this.getCustomerInfo(estimate.customer);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CUSTOMER DETAILS:', 115, 40);
    doc.text(custInfo.name, 115, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    let custY = 50;
    if (custInfo.phone && custInfo.phone !== '0') {
      doc.text(`Mobile: ${custInfo.phone}`, 115, custY);
      custY += 4.5;
    }
    if (custInfo.address) {
      const addrCombined = custInfo.location ? `${custInfo.address}, ${custInfo.location}` : custInfo.address;
      const addrLines = doc.splitTextToSize(`Address: ${addrCombined}`, 80);
      doc.text(addrLines, 115, custY);
      custY += (addrLines.length * 4);
    } else if (custInfo.location) {
      doc.text(`Location: ${custInfo.location}`, 115, custY);
      custY += 4.5;
    }

    const tableStartY = Math.max(60, custY + 3);
    const tableBody = (estimate.estimateItems || []).map((item, index) => {
      const code = item.barcodeValue || (item as any).barcode;
      const displayDesc = item.itemName ? (code ? `${item.itemName} [${code}]` : item.itemName) : (code ? `Item [${code}]` : 'Ornament');
      return [
        index + 1,
        displayDesc,
        (item.grossWeight || 0).toFixed(3),
        (item.stoneWeight || 0).toFixed(3),
        (item.netWeight || 0).toFixed(3),
        (item.wastagePercent || 0) + '%',
        '₹' + (item.metalValue || 0).toFixed(2),
        '₹' + (item.makingChargeAmount || 0).toFixed(2),
        '₹' + (item.itemTotal || 0).toFixed(2)
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Item', 'Gross (g)', 'Stone (g)', 'Net (g)', 'Wastage', 'Metal Value', 'Making', 'Total']],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 8.5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Estimated Grand Total: ₹${(estimate.grandTotal || 0).toFixed(2)}`, 130, finalY);

    const fileName = `Estimate_${estimate.estimateNumber || estimate.id || 'QUOTATION'}.pdf`;
    this.dispatchPrint(doc, fileName);
  }

  /**
   * Helper to normalize customer name, phone, address, and location
   */
  private getCustomerInfo(cust: any) {
    const name = cust?.customerName || cust?.customername || 'Walk-in Customer';
    const rawPhone = cust?.phoneno || cust?.mobileno || cust?.mobilenumber || cust?.phone || '';
    const phone = (rawPhone && rawPhone !== 0 && rawPhone !== '0') ? String(rawPhone) : '';
    const address = cust?.address || cust?.Address || cust?.fullAddress || '';
    const locationParts = [cust?.area, cust?.district || cust?.city, cust?.state, cust?.pincode ? `PIN: ${cust.pincode}` : '']
      .filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : '';
    return { name, phone, address, location };
  }

  /**
   * Dispatches PDF for print or immediate download without being blocked by browser popup blockers
   */
  private dispatchPrint(doc: jsPDF, defaultFileName: string) {
    try {
      // 1. Try opening via blob URL
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);

      // 2. Open in new tab or fallback to direct download
      const printWindow = window.open(blobUrl, '_blank');
      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        // Popup was blocked by browser -> directly trigger file download so user gets PDF
        doc.save(defaultFileName);
      } else {
        // Trigger print in new window if allowed
        printWindow.focus();
      }

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 120000);
    } catch (e) {
      // Direct file save fallback
      doc.save(defaultFileName);
    }
  }
}
