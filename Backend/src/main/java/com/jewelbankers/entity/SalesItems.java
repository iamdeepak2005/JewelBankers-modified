package com.jewelbankers.entity;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonBackReference;

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
@Table(name = "sales_item")
public class SalesItems {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @JsonBackReference("sales-items")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesid", referencedColumnName = "id")
    private Sales sales;
    
    //@JsonManagedReference("purchase-item") // Use @JsonManagedReference here
	/*
	 * @ManyToOne(fetch = FetchType.LAZY)
	 * 
	 * @JoinColumn(name = "purchaseitemid", referencedColumnName = "id") private
	 * PurchaseItems purchaseItem; // Relationship with PurchaseItems
	 */
	@Column(name = "quantity")
    private Integer quantity;
    
    @Column(name = "grosswt")
    private double grosswt;
    
    @Column(name = "netwt")
    private double netwt;
    
    @Column(name = "purity")
    private double purity;
    
    @Column(name = "wastagecharge")
    private double wastagecharge;
    
    @Column(name = "wastagepercent")
    private double wastagepercent;
    
    @Column(name = "rate")
    private double rate;
    
    @Column(name = "makingpercent")
    private double makingpercent;

	@Column(name = "makingcharge")
    private double makingcharge;
    
    @Column(name = "hallmarkcharges")
    private double hallmarkcharges;
    
	/*
	 * @ManyToOne
	 * 
	 * @JoinColumn(name = "barcodeid", referencedColumnName = "id") private Barcode
	 * barcode;
	 */
    
	/*
	 * @Column(name = "gstamount") private BigDecimal gstamount;
	 */
    
    
    //Set all foreign key mappings in sales table
    @Column(name = "amount")
    private BigDecimal amount;
    
    @Column(name = "itemid")
    private Long itemid;
    

	@Column(name = "purchaseid")
    private Long purchaseid;
    
    @Column(name = "purchaseitemid")
    private Long purchaseitemid;

    @Column(name = "barcode_value")
    private String barcode;

    @Column(name = "huid")
    private String huid;

    @Column(name = "design_no")
    private String designNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "metal_type")
    private com.jewelbankers.enums.MetalType metalType;

    @Enumerated(EnumType.STRING)
    @Column(name = "making_charge_type")
    private com.jewelbankers.enums.MakingChargeType makingChargeType;

    @Column(name = "stone_weight", precision = 10, scale = 4)
    private BigDecimal stoneWeight;

    @Column(name = "stone_amount", precision = 12, scale = 2)
    private BigDecimal stoneAmount;

    @Column(name = "fine_weight", precision = 10, scale = 4)
    private BigDecimal fineWeight;

    @Column(name = "taxable_amount", precision = 15, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "gst_amount", precision = 12, scale = 2)
    private BigDecimal gstAmount;

    @Column(name = "total_amount", precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "item_name")
    private String itemName;
    
    public Long getPurchaseid() {
		return purchaseid;
	}

	public void setPurchaseid(Long purchaseid) {
		this.purchaseid = purchaseid;
	}

	public Long getPurchaseitemid() {
		return purchaseitemid;
	}

	public void setPurchaseitemid(Long purchaseitemid) {
		this.purchaseitemid = purchaseitemid;
	}

	public Long getItemid() {
		return itemid;
	}

	public void setItemid(Long itemid) {
		this.itemid = itemid;
	}

	public double getWastagepercent() {
		return wastagepercent;
	}

	public void setWastagepercent(double wastagepercent) {
		this.wastagepercent = wastagepercent;
	}

	public double getMakingpercent() {
		return makingpercent;
	}

	public void setMakingpercent(double makingpercent) {
		this.makingpercent = makingpercent;
	}

	public double getHallmarkcharges() {
		return hallmarkcharges;
	}

	public void setHallmarkcharges(double hallmarkcharges) {
		this.hallmarkcharges = hallmarkcharges;
	}    

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Sales getSales() {
		return sales;
	}

	public void setSales(Sales sales) {
		this.sales = sales;
	}

	public Integer getQuantity() {
		return quantity;
	}

	public void setQuantity(Integer quantity) {
		this.quantity = quantity;
	}

	public double getGrosswt() {
		return grosswt;
	}

	public void setGrosswt(double grosswt) {
		this.grosswt = grosswt;
	}

	public double getNetwt() {
		return netwt;
	}

	public void setNetwt(double netwt) {
		this.netwt = netwt;
	}

	public double getPurity() {
		return purity;
	}

	public void setPurity(double purity) {
		this.purity = purity;
	}

	public double getWastagecharge() {
		return wastagecharge;
	}

	public void setWastagecharge(double wastagecharge) {
		this.wastagecharge = wastagecharge;
	}

	public double getRate() {
		return rate;
	}

	public void setRate(double rate) {
		this.rate = rate;
	}


	/*
	 * public BigDecimal getGstamount() { return gstamount; }
	 * 
	 * public void setGstamount(BigDecimal gstamount) { this.gstamount = gstamount;
	 * }
	 */

	public double getMakingcharge() {
		return makingcharge;
	}

	public void setMakingcharge(double makingcharge) {
		this.makingcharge = makingcharge;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public String getBarcode() {
		return barcode;
	}

	public void setBarcode(String barcode) {
		this.barcode = barcode;
	}

	public String getHuid() {
		return huid;
	}

	public void setHuid(String huid) {
		this.huid = huid;
	}

	public String getDesignNo() {
		return designNo;
	}

	public void setDesignNo(String designNo) {
		this.designNo = designNo;
	}

	public com.jewelbankers.enums.MetalType getMetalType() {
		return metalType;
	}

	public void setMetalType(com.jewelbankers.enums.MetalType metalType) {
		this.metalType = metalType;
	}

	public com.jewelbankers.enums.MakingChargeType getMakingChargeType() {
		return makingChargeType;
	}

	public void setMakingChargeType(com.jewelbankers.enums.MakingChargeType makingChargeType) {
		this.makingChargeType = makingChargeType;
	}

	public BigDecimal getStoneWeight() {
		return stoneWeight;
	}

	public void setStoneWeight(BigDecimal stoneWeight) {
		this.stoneWeight = stoneWeight;
	}

	public BigDecimal getStoneAmount() {
		return stoneAmount;
	}

	public void setStoneAmount(BigDecimal stoneAmount) {
		this.stoneAmount = stoneAmount;
	}

	public BigDecimal getFineWeight() {
		return fineWeight;
	}

	public void setFineWeight(BigDecimal fineWeight) {
		this.fineWeight = fineWeight;
	}

	public BigDecimal getTaxableAmount() {
		return taxableAmount;
	}

	public void setTaxableAmount(BigDecimal taxableAmount) {
		this.taxableAmount = taxableAmount;
	}

	public BigDecimal getGstAmount() {
		return gstAmount;
	}

	public void setGstAmount(BigDecimal gstAmount) {
		this.gstAmount = gstAmount;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public void setTotalAmount(BigDecimal totalAmount) {
		this.totalAmount = totalAmount;
	}

	public String getItemName() {
		return itemName;
	}

	public void setItemName(String itemName) {
		this.itemName = itemName;
	}
    
}

