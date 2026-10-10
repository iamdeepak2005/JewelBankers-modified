package com.jewelbankers.entity;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.jewelbankers.enums.MetalType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "estimate_items")
public class EstimateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @JsonBackReference("estimate-items")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estimate_id", referencedColumnName = "id")
    private Estimate estimate;

    @Column(name = "item_name", length = 200)
    private String itemName;

    @Column(name = "category", length = 100)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "metal_type", length = 20)
    private MetalType metalType;

    @Column(name = "purity", precision = 8, scale = 3)
    private BigDecimal purity;

    @Column(name = "gross_weight", precision = 10, scale = 3)
    private BigDecimal grossWeight;

    @Column(name = "stone_weight", precision = 10, scale = 3)
    private BigDecimal stoneWeight;

    @Column(name = "net_weight", precision = 10, scale = 3)
    private BigDecimal netWeight;

    @Column(name = "fine_weight", precision = 10, scale = 3)
    private BigDecimal fineWeight;

    @Column(name = "rate", precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(name = "metal_value", precision = 14, scale = 2)
    private BigDecimal metalValue;

    @Column(name = "making_charge", precision = 12, scale = 2)
    private BigDecimal makingCharge;

    @Column(name = "wastage", precision = 12, scale = 2)
    private BigDecimal wastage;

    @Column(name = "wastage_percent", precision = 8, scale = 3)
    private BigDecimal wastagePercent;

    @Column(name = "stone_value", precision = 12, scale = 2)
    private BigDecimal stoneValue;

    @Column(name = "discount", precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(name = "taxable_amount", precision = 14, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "gst", precision = 12, scale = 2)
    private BigDecimal gst;

    @Column(name = "line_total", precision = 14, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(name = "design_no", length = 50)
    private String designNo;

    @Column(name = "huid", length = 50)
    private String huid;

    @Column(name = "barcode_value", length = 100)
    private String barcodeValue;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Estimate getEstimate() { return estimate; }
    public void setEstimate(Estimate estimate) { this.estimate = estimate; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public MetalType getMetalType() { return metalType; }
    public void setMetalType(MetalType metalType) { this.metalType = metalType; }

    public BigDecimal getPurity() { return purity; }
    public void setPurity(BigDecimal purity) { this.purity = purity; }

    public BigDecimal getGrossWeight() { return grossWeight; }
    public void setGrossWeight(BigDecimal grossWeight) { this.grossWeight = grossWeight; }

    public BigDecimal getStoneWeight() { return stoneWeight; }
    public void setStoneWeight(BigDecimal stoneWeight) { this.stoneWeight = stoneWeight; }

    public BigDecimal getNetWeight() { return netWeight; }
    public void setNetWeight(BigDecimal netWeight) { this.netWeight = netWeight; }

    public BigDecimal getFineWeight() { return fineWeight; }
    public void setFineWeight(BigDecimal fineWeight) { this.fineWeight = fineWeight; }

    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }

    public BigDecimal getMetalValue() { return metalValue; }
    public void setMetalValue(BigDecimal metalValue) { this.metalValue = metalValue; }

    public BigDecimal getMakingCharge() { return makingCharge; }
    public void setMakingCharge(BigDecimal makingCharge) { this.makingCharge = makingCharge; }

    public BigDecimal getWastage() { return wastage; }
    public void setWastage(BigDecimal wastage) { this.wastage = wastage; }

    public BigDecimal getWastagePercent() { return wastagePercent; }
    public void setWastagePercent(BigDecimal wastagePercent) { this.wastagePercent = wastagePercent; }

    public BigDecimal getStoneValue() { return stoneValue; }
    public void setStoneValue(BigDecimal stoneValue) { this.stoneValue = stoneValue; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getTaxableAmount() { return taxableAmount; }
    public void setTaxableAmount(BigDecimal taxableAmount) { this.taxableAmount = taxableAmount; }

    public BigDecimal getGst() { return gst; }
    public void setGst(BigDecimal gst) { this.gst = gst; }

    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }

    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }

    public String getDesignNo() { return designNo; }
    public void setDesignNo(String designNo) { this.designNo = designNo; }

    public String getHuid() { return huid; }
    public void setHuid(String huid) { this.huid = huid; }

    public String getBarcodeValue() { return barcodeValue; }
    public void setBarcodeValue(String barcodeValue) { this.barcodeValue = barcodeValue; }
}
