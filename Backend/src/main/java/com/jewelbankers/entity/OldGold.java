package com.jewelbankers.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
@Table(name = "old_gold")
public class OldGold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customerid", referencedColumnName = "customerid")
    private Customer customer;

    @Column(name = "sale_id")
    private Long saleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "metal_type", length = 20)
    private MetalType metalType;

    @Column(name = "purity", precision = 8, scale = 3)
    private BigDecimal purity;

    @Column(name = "tested_purity", precision = 8, scale = 3)
    private BigDecimal testedPurity;

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

    @Column(name = "melting_deduction", precision = 12, scale = 2)
    private BigDecimal meltingDeduction;

    @Column(name = "stone_deduction", precision = 12, scale = 2)
    private BigDecimal stoneDeduction;

    @Column(name = "other_deduction", precision = 12, scale = 2)
    private BigDecimal otherDeduction;

    @Column(name = "final_value", precision = 14, scale = 2)
    private BigDecimal finalValue;

    @Column(name = "testing_method", length = 100)
    private String testingMethod;

    @Column(name = "item_description", length = 500)
    private String itemDescription;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "notes", length = 1000)
    private String notes;

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
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Long getSaleId() { return saleId; }
    public void setSaleId(Long saleId) { this.saleId = saleId; }

    public MetalType getMetalType() { return metalType; }
    public void setMetalType(MetalType metalType) { this.metalType = metalType; }

    public BigDecimal getPurity() { return purity; }
    public void setPurity(BigDecimal purity) { this.purity = purity; }

    public BigDecimal getTestedPurity() { return testedPurity; }
    public void setTestedPurity(BigDecimal testedPurity) { this.testedPurity = testedPurity; }

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

    public BigDecimal getMeltingDeduction() { return meltingDeduction; }
    public void setMeltingDeduction(BigDecimal meltingDeduction) { this.meltingDeduction = meltingDeduction; }

    public BigDecimal getStoneDeduction() { return stoneDeduction; }
    public void setStoneDeduction(BigDecimal stoneDeduction) { this.stoneDeduction = stoneDeduction; }

    public BigDecimal getOtherDeduction() { return otherDeduction; }
    public void setOtherDeduction(BigDecimal otherDeduction) { this.otherDeduction = otherDeduction; }

    public BigDecimal getFinalValue() { return finalValue; }
    public void setFinalValue(BigDecimal finalValue) { this.finalValue = finalValue; }

    public String getTestingMethod() { return testingMethod; }
    public void setTestingMethod(String testingMethod) { this.testingMethod = testingMethod; }

    public String getItemDescription() { return itemDescription; }
    public void setItemDescription(String itemDescription) { this.itemDescription = itemDescription; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
