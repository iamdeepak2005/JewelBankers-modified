package com.jewelbankers.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.jewelbankers.enums.EstimateStatus;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "estimates")
public class Estimate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "estimate_no")
    private Long estimateNo;

    @Column(name = "estimate_prefix", length = 10)
    private String estimatePrefix;

    @Column(name = "estimate_date")
    private LocalDateTime estimateDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customerid", referencedColumnName = "customerid")
    private Customer customer;

    @JsonManagedReference("estimate-items")
    @OneToMany(mappedBy = "estimate", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EstimateItem> estimateItems = new ArrayList<>();

    @Column(name = "gold_rate", precision = 12, scale = 2)
    private BigDecimal goldRate;

    @Column(name = "silver_rate", precision = 12, scale = 2)
    private BigDecimal silverRate;

    @Column(name = "subtotal", precision = 14, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "cgst", precision = 12, scale = 2)
    private BigDecimal cgst;

    @Column(name = "sgst", precision = 12, scale = 2)
    private BigDecimal sgst;

    @Column(name = "discount", precision = 12, scale = 2)
    private BigDecimal discount;

    @Column(name = "round_off", precision = 8, scale = 2)
    private BigDecimal roundOff;

    @Column(name = "grand_total", precision = 14, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private EstimateStatus status;

    @Column(name = "converted_sale_id")
    private Long convertedSaleId;

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
            this.status = EstimateStatus.ACTIVE;
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.estimatePrefix == null) {
            this.estimatePrefix = "EST";
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEstimateNo() { return estimateNo; }
    public void setEstimateNo(Long estimateNo) { this.estimateNo = estimateNo; }

    public String getEstimatePrefix() { return estimatePrefix; }
    public void setEstimatePrefix(String estimatePrefix) { this.estimatePrefix = estimatePrefix; }

    public LocalDateTime getEstimateDate() { return estimateDate; }
    public void setEstimateDate(LocalDateTime estimateDate) { this.estimateDate = estimateDate; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public List<EstimateItem> getEstimateItems() { return estimateItems; }
    public void setEstimateItems(List<EstimateItem> estimateItems) { this.estimateItems = estimateItems; }

    public BigDecimal getGoldRate() { return goldRate; }
    public void setGoldRate(BigDecimal goldRate) { this.goldRate = goldRate; }

    public BigDecimal getSilverRate() { return silverRate; }
    public void setSilverRate(BigDecimal silverRate) { this.silverRate = silverRate; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getCgst() { return cgst; }
    public void setCgst(BigDecimal cgst) { this.cgst = cgst; }

    public BigDecimal getSgst() { return sgst; }
    public void setSgst(BigDecimal sgst) { this.sgst = sgst; }

    public BigDecimal getDiscount() { return discount; }
    public void setDiscount(BigDecimal discount) { this.discount = discount; }

    public BigDecimal getRoundOff() { return roundOff; }
    public void setRoundOff(BigDecimal roundOff) { this.roundOff = roundOff; }

    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public LocalDateTime getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDateTime validUntil) { this.validUntil = validUntil; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public EstimateStatus getStatus() { return status; }
    public void setStatus(EstimateStatus status) { this.status = status; }

    public Long getConvertedSaleId() { return convertedSaleId; }
    public void setConvertedSaleId(Long convertedSaleId) { this.convertedSaleId = convertedSaleId; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
