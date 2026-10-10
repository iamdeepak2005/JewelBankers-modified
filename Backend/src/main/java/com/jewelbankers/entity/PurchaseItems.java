package com.jewelbankers.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.jewelbankers.enums.ItemStatus;
import com.jewelbankers.enums.MakingChargeType;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "purchaseitems")
public class PurchaseItems {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @JsonBackReference("purchase-items")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchaseid", referencedColumnName = "id")
    private Purchase purchase;

    @Column(name = "itemid")
    private Long itemid;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "itemid", referencedColumnName = "id", insertable = false, updatable = false)
    private Item item;

    @JsonManagedReference("barcode")
    @ManyToOne
    @JoinColumn(name = "barcodeid", referencedColumnName = "id")
    private Barcode barcode;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_status")
    private ItemStatus itemStatus;

    @Column(name = "quantity")
    private Integer quantity;

    // --- Existing fields (preserved) ---

    @Column(name = "wastagepercent")
    private double wastagepercent;

    @Column(name = "weight")
    private double weight;

    @Column(name = "stoneweight")
    private BigDecimal stoneweight;

    @Column(name = "purity")
    private double purity;

    @Column(name = "rate")
    private BigDecimal rate;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "totalamount")
    private BigDecimal totalamount;

    @Column(name = "status")
    private String status;

    // --- New jewellery-specific fields ---

    @Column(name = "grossweight", precision = 10, scale = 3)
    private BigDecimal grossweight;

    @Column(name = "net_weight", precision = 10, scale = 3)
    private BigDecimal netWeight;

    @Column(name = "fine_weight", precision = 10, scale = 3)
    private BigDecimal fineWeight;

    @Column(name = "wastage_weight", precision = 10, scale = 3)
    private BigDecimal wastageWeight;

    @Column(name = "design_no", length = 50)
    private String designNo;

    @Column(name = "huid", length = 50)
    private String huid;

    @Column(name = "sku", length = 50)
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column(name = "metal_type", length = 20)
    private MetalType metalType;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "item_name", length = 200)
    private String itemName;

    @Column(name = "making_charge", precision = 12, scale = 2)
    private BigDecimal makingCharge;

    @Enumerated(EnumType.STRING)
    @Column(name = "making_charge_type", length = 20)
    private MakingChargeType makingChargeType;

    @Column(name = "stone_count")
    private Integer stoneCount;

    @Column(name = "stone_value", precision = 12, scale = 2)
    private BigDecimal stoneValue;

    @Column(name = "stone_details", length = 500)
    private String stoneDetails;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "rack", length = 50)
    private String rack;

    @Column(name = "tray", length = 50)
    private String tray;

    @Column(name = "counter", length = 50)
    private String counter;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Column(name = "hsn_code", length = 20)
    private String hsnCode;

    @Column(name = "metal_value", precision = 14, scale = 2)
    private BigDecimal metalValue;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = "AVAILABLE";
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Existing Getters and Setters ---

    public Long getItemid() { return itemid; }
    public void setItemid(Long itemid) { this.itemid = itemid; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Purchase getPurchase() { return purchase; }
    public void setPurchase(Purchase purchase) { this.purchase = purchase; }

    public Barcode getBarcode() { return barcode; }
    public void setBarcode(Barcode barcode) { this.barcode = barcode; }

    public double getWastagepercent() { return wastagepercent; }
    public void setWastagepercent(double wastagepercent) { this.wastagepercent = wastagepercent; }

    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }

    public BigDecimal getStoneweight() { return stoneweight; }
    public void setStoneweight(BigDecimal stoneweight) { this.stoneweight = stoneweight; }

    public double getPurity() { return purity; }
    public void setPurity(double purity) { this.purity = purity; }

    public BigDecimal getRate() { return rate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getTotalamount() { return totalamount; }
    public void setTotalamount(BigDecimal totalamount) { this.totalamount = totalamount; }

    // --- New Getters and Setters ---

    public BigDecimal getGrossweight() { return grossweight; }
    public void setGrossweight(BigDecimal grossweight) { this.grossweight = grossweight; }

    public BigDecimal getNetWeight() { return netWeight; }
    public void setNetWeight(BigDecimal netWeight) { this.netWeight = netWeight; }

    public BigDecimal getFineWeight() { return fineWeight; }
    public void setFineWeight(BigDecimal fineWeight) { this.fineWeight = fineWeight; }

    public BigDecimal getWastageWeight() { return wastageWeight; }
    public void setWastageWeight(BigDecimal wastageWeight) { this.wastageWeight = wastageWeight; }

    public String getDesignNo() { return designNo; }
    public void setDesignNo(String designNo) { this.designNo = designNo; }

    public String getHuid() { return huid; }
    public void setHuid(String huid) { this.huid = huid; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public MetalType getMetalType() { return metalType; }
    public void setMetalType(MetalType metalType) { this.metalType = metalType; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public BigDecimal getMakingCharge() { return makingCharge; }
    public void setMakingCharge(BigDecimal makingCharge) { this.makingCharge = makingCharge; }

    public MakingChargeType getMakingChargeType() { return makingChargeType; }
    public void setMakingChargeType(MakingChargeType makingChargeType) { this.makingChargeType = makingChargeType; }

    public Integer getStoneCount() { return stoneCount; }
    public void setStoneCount(Integer stoneCount) { this.stoneCount = stoneCount; }

    public BigDecimal getStoneValue() { return stoneValue; }
    public void setStoneValue(BigDecimal stoneValue) { this.stoneValue = stoneValue; }

    public String getStoneDetails() { return stoneDetails; }
    public void setStoneDetails(String stoneDetails) { this.stoneDetails = stoneDetails; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getRack() { return rack; }
    public void setRack(String rack) { this.rack = rack; }

    public String getTray() { return tray; }
    public void setTray(String tray) { this.tray = tray; }

    public String getCounter() { return counter; }
    public void setCounter(String counter) { this.counter = counter; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }

    public BigDecimal getMetalValue() { return metalValue; }
    public void setMetalValue(BigDecimal metalValue) { this.metalValue = metalValue; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public ItemStatus getItemStatus() { return itemStatus; }
    public void setItemStatus(ItemStatus itemStatus) { this.itemStatus = itemStatus; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }
}
