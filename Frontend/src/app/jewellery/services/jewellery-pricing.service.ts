import { Injectable } from '@angular/core';
import { MakingChargeType } from '../models/jewellery.models';

export interface ItemPricingBreakdown {
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  purity: number;
  ratePerGram: number;
  wastagePercent: number;
  wastageWeight: number;
  metalWeightWithWastage: number;
  fineWeight: number;
  metalValue: number;
  makingChargeType: MakingChargeType;
  makingChargeRate: number;
  makingChargeAmount: number;
  stoneAmount: number;
  hallmarkCharges: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  itemTotal: number;
}

export interface OldGoldBreakdown {
  grossWeight: number;
  deductions: number;
  netWeight: number;
  purity: number;
  fineWeight: number;
  ratePerGram: number;
  totalValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class JewelleryPricingService {
  public readonly DEFAULT_GST_PERCENT = 3.0; // 3% GST on jewellery (1.5% CGST + 1.5% SGST)

  /**
   * Calculates comprehensive item-level jewellery pricing with full breakdown
   */
  calculateItemPrice(params: {
    grossWeight: number;
    stoneWeight?: number;
    purity?: number;
    ratePerGram: number;
    wastagePercent?: number;
    makingChargeType?: MakingChargeType;
    makingChargeRate?: number;
    stoneAmount?: number;
    hallmarkCharges?: number;
    gstPercent?: number;
  }): ItemPricingBreakdown {
    const gross = Number(params.grossWeight) || 0;
    const stoneWt = Number(params.stoneWeight) || 0;
    const net = Math.max(0, gross - stoneWt);
    const purity = Number(params.purity) || 91.6; // Default 22K (91.6%)
    const rate = Number(params.ratePerGram) || 0;
    const wastagePct = Number(params.wastagePercent) || 0;
    const chargeType = params.makingChargeType || 'PERCENT';
    const chargeRate = Number(params.makingChargeRate) || 0;
    const stoneAmt = Number(params.stoneAmount) || 0;
    const hallmark = Number(params.hallmarkCharges) || 0;
    const gstPct = params.gstPercent !== undefined ? Number(params.gstPercent) : this.DEFAULT_GST_PERCENT;

    // 1. Wastage Calculation
    const wastageWeight = (net * wastagePct) / 100;
    const metalWeightWithWastage = net + wastageWeight;

    // 2. Fine weight
    const fineWeight = (net * purity) / 100;

    // 3. Metal Value
    const metalValue = metalWeightWithWastage * rate;

    // 4. Making Charges Calculation
    let makingChargeAmount = 0;
    if (chargeType === 'FLAT') {
      makingChargeAmount = chargeRate;
    } else if (chargeType === 'PER_GRAM') {
      makingChargeAmount = net * chargeRate;
    } else {
      // PERCENT: percentage of raw net metal value
      makingChargeAmount = (net * rate * chargeRate) / 100;
    }

    // 5. Taxable Amount
    const taxableAmount = metalValue + makingChargeAmount + stoneAmt + hallmark;

    // 6. GST Calculation
    const gstAmount = (taxableAmount * gstPct) / 100;

    // 7. Item Total
    const itemTotal = taxableAmount + gstAmount;

    return {
      grossWeight: this.round(gross, 3),
      stoneWeight: this.round(stoneWt, 3),
      netWeight: this.round(net, 3),
      purity: this.round(purity, 2),
      ratePerGram: this.round(rate, 2),
      wastagePercent: this.round(wastagePct, 2),
      wastageWeight: this.round(wastageWeight, 3),
      metalWeightWithWastage: this.round(metalWeightWithWastage, 3),
      fineWeight: this.round(fineWeight, 3),
      metalValue: this.round(metalValue, 2),
      makingChargeType: chargeType,
      makingChargeRate: this.round(chargeRate, 2),
      makingChargeAmount: this.round(makingChargeAmount, 2),
      stoneAmount: this.round(stoneAmt, 2),
      hallmarkCharges: this.round(hallmark, 2),
      taxableAmount: this.round(taxableAmount, 2),
      gstPercent: gstPct,
      gstAmount: this.round(gstAmount, 2),
      itemTotal: this.round(itemTotal, 2)
    };
  }

  /**
   * Calculates old gold exchange / trade-in valuation
   */
  calculateOldGold(params: {
    grossWeight: number;
    dustDeduction?: number;
    stoneDeduction?: number;
    waxDeduction?: number;
    testedPurity: number;
    marketRate: number;
  }): OldGoldBreakdown {
    const gross = Number(params.grossWeight) || 0;
    const dust = Number(params.dustDeduction) || 0;
    const stone = Number(params.stoneDeduction) || 0;
    const wax = Number(params.waxDeduction) || 0;
    const totalDeductions = dust + stone + wax;
    const net = Math.max(0, gross - totalDeductions);
    const purity = Number(params.testedPurity) || 0;
    const fineWeight = (net * purity) / 100;
    const rate = Number(params.marketRate) || 0;
    const totalValue = fineWeight * rate;

    return {
      grossWeight: this.round(gross, 3),
      deductions: this.round(totalDeductions, 3),
      netWeight: this.round(net, 3),
      purity: this.round(purity, 2),
      fineWeight: this.round(fineWeight, 3),
      ratePerGram: this.round(rate, 2),
      totalValue: this.round(totalValue, 2)
    };
  }

  /**
   * Calculates entire Bill totals with multiple items, old gold exchange, discount, and round-off
   */
  calculateBillTotals(
    items: ItemPricingBreakdown[],
    oldGoldAmount: number = 0,
    discountAmount: number = 0
  ) {
    let subTotal = 0;
    let totalTaxable = 0;
    let totalGst = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;

    for (const item of items) {
      subTotal += item.metalValue + item.makingChargeAmount + item.stoneAmount + item.hallmarkCharges;
      totalTaxable += item.taxableAmount;
      totalGst += item.gstAmount;
      totalGrossWeight += item.grossWeight;
      totalNetWeight += item.netWeight;
    }

    const netBeforeAdjustment = totalTaxable + totalGst - (discountAmount || 0);
    const netPayableExact = Math.max(0, netBeforeAdjustment - (oldGoldAmount || 0));
    const grandTotalRounded = Math.round(netPayableExact);
    const roundOff = this.round(grandTotalRounded - netPayableExact, 2);

    return {
      totalItemsCount: items.length,
      totalGrossWeight: this.round(totalGrossWeight, 3),
      totalNetWeight: this.round(totalNetWeight, 3),
      subTotal: this.round(subTotal, 2),
      taxableAmount: this.round(totalTaxable, 2),
      cgstAmount: this.round(totalGst / 2, 2),
      sgstAmount: this.round(totalGst / 2, 2),
      totalGstAmount: this.round(totalGst, 2),
      discountAmount: this.round(discountAmount, 2),
      oldGoldAmount: this.round(oldGoldAmount, 2),
      netPayableExact: this.round(netPayableExact, 2),
      roundOff,
      grandTotal: grandTotalRounded
    };
  }

  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
