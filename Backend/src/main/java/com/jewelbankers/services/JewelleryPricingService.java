package com.jewelbankers.services;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.springframework.stereotype.Service;

import com.jewelbankers.enums.MakingChargeType;

/**
 * Centralized pricing engine for all jewellery calculations.
 * Uses BigDecimal throughout for financial precision.
 * 
 * Standard jewellery pricing formula:
 * Net Weight = Gross Weight - Stone Weight
 * Fine Weight = Net Weight × (Purity / 100)
 * Metal Value = Fine Weight × Rate per gram
 * Wastage = Net Weight × (Wastage% / 100) × Rate
 * Making Charge = varies by type (FLAT, PERCENT, PER_GRAM)
 * Taxable Amount = Metal Value + Wastage + Making Charge + Stone Value - Discount
 * GST = Taxable Amount × GST% (split into CGST + SGST)
 * Line Total = Taxable Amount + GST
 */
@Service
public class JewelleryPricingService {

    private static final int SCALE = 2;
    private static final int WEIGHT_SCALE = 3;
    private static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

    /**
     * Calculate net weight: grossWeight - stoneWeight
     */
    public BigDecimal calculateNetWeight(BigDecimal grossWeight, BigDecimal stoneWeight) {
        BigDecimal stone = stoneWeight != null ? stoneWeight : BigDecimal.ZERO;
        BigDecimal net = grossWeight.subtract(stone);
        return net.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : net.setScale(WEIGHT_SCALE, ROUNDING);
    }

    /**
     * Calculate fine weight: netWeight × (purity / 100)
     * Purity is expressed as percentage (e.g., 91.6 for 22K gold)
     */
    public BigDecimal calculateFineWeight(BigDecimal netWeight, BigDecimal purityPercent) {
        if (netWeight == null || purityPercent == null) return BigDecimal.ZERO;
        return netWeight.multiply(purityPercent)
                .divide(BigDecimal.valueOf(100), WEIGHT_SCALE, ROUNDING);
    }

    /**
     * Calculate metal value: fineWeight × ratePerGram
     */
    public BigDecimal calculateMetalValue(BigDecimal fineWeight, BigDecimal ratePerGram) {
        if (fineWeight == null || ratePerGram == null) return BigDecimal.ZERO;
        return fineWeight.multiply(ratePerGram).setScale(SCALE, ROUNDING);
    }

    /**
     * Calculate wastage amount: netWeight × (wastagePercent / 100) × ratePerGram
     */
    public BigDecimal calculateWastage(BigDecimal netWeight, BigDecimal wastagePercent, BigDecimal ratePerGram) {
        if (netWeight == null || wastagePercent == null || ratePerGram == null) return BigDecimal.ZERO;
        return netWeight.multiply(wastagePercent)
                .divide(BigDecimal.valueOf(100), WEIGHT_SCALE, ROUNDING)
                .multiply(ratePerGram)
                .setScale(SCALE, ROUNDING);
    }

    /**
     * Calculate wastage weight: netWeight × (wastagePercent / 100)
     */
    public BigDecimal calculateWastageWeight(BigDecimal netWeight, BigDecimal wastagePercent) {
        if (netWeight == null || wastagePercent == null) return BigDecimal.ZERO;
        return netWeight.multiply(wastagePercent)
                .divide(BigDecimal.valueOf(100), WEIGHT_SCALE, ROUNDING);
    }

    /**
     * Calculate making charge based on type:
     * FLAT: chargeValue (fixed amount)
     * PERCENT: metalValue × (chargeValue / 100)
     * PER_GRAM: netWeight × chargeValue
     */
    public BigDecimal calculateMakingCharge(MakingChargeType type, BigDecimal chargeValue,
                                            BigDecimal netWeight, BigDecimal metalValue) {
        if (type == null || chargeValue == null) return BigDecimal.ZERO;
        switch (type) {
            case FLAT:
                return chargeValue.setScale(SCALE, ROUNDING);
            case PERCENT:
                BigDecimal base = metalValue != null ? metalValue : BigDecimal.ZERO;
                return base.multiply(chargeValue)
                        .divide(BigDecimal.valueOf(100), SCALE, ROUNDING);
            case PER_GRAM:
                BigDecimal wt = netWeight != null ? netWeight : BigDecimal.ZERO;
                return wt.multiply(chargeValue).setScale(SCALE, ROUNDING);
            default:
                return BigDecimal.ZERO;
        }
    }

    /**
     * Calculate taxable amount (before GST):
     * metalValue + wastage + makingCharge + stoneValue - discount
     */
    public BigDecimal calculateTaxableAmount(BigDecimal metalValue, BigDecimal wastage,
                                             BigDecimal makingCharge, BigDecimal stoneValue,
                                             BigDecimal discount) {
        BigDecimal total = safe(metalValue)
                .add(safe(wastage))
                .add(safe(makingCharge))
                .add(safe(stoneValue))
                .subtract(safe(discount));
        return total.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total.setScale(SCALE, ROUNDING);
    }

    /**
     * Calculate GST amount: taxableAmount × (gstPercent / 100)
     */
    public BigDecimal calculateGST(BigDecimal taxableAmount, BigDecimal gstPercent) {
        if (taxableAmount == null || gstPercent == null) return BigDecimal.ZERO;
        return taxableAmount.multiply(gstPercent)
                .divide(BigDecimal.valueOf(100), SCALE, ROUNDING);
    }

    /**
     * Calculate line total: taxableAmount + gst
     */
    public BigDecimal calculateLineTotal(BigDecimal taxableAmount, BigDecimal gst) {
        return safe(taxableAmount).add(safe(gst)).setScale(SCALE, ROUNDING);
    }

    /**
     * Calculate grand total from line totals with discount and round-off.
     */
    public BigDecimal calculateGrandTotal(BigDecimal subtotal, BigDecimal cgst, BigDecimal sgst,
                                          BigDecimal discount, BigDecimal roundOff) {
        BigDecimal total = safe(subtotal)
                .add(safe(cgst))
                .add(safe(sgst))
                .subtract(safe(discount))
                .add(safe(roundOff));
        return total.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : total.setScale(SCALE, ROUNDING);
    }

    /**
     * Calculate round-off to nearest rupee.
     * Returns the adjustment amount (can be negative).
     */
    public BigDecimal calculateRoundOff(BigDecimal amount) {
        if (amount == null) return BigDecimal.ZERO;
        BigDecimal rounded = amount.setScale(0, ROUNDING);
        return rounded.subtract(amount).setScale(SCALE, ROUNDING);
    }

    /**
     * Split GST equally into CGST and SGST.
     */
    public BigDecimal[] splitGST(BigDecimal totalGst) {
        BigDecimal half = safe(totalGst).divide(BigDecimal.valueOf(2), SCALE, ROUNDING);
        return new BigDecimal[]{half, half};
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
