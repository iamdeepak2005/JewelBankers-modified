package com.jewelbankers.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "barcodes")
public class Barcode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "tag")
    private String tag;

    @Column(name = "barcode_value", unique = true, length = 50)
    private String barcodeValue;

    @JsonBackReference("barcode")
    @ManyToOne
    @JoinColumn(name = "purchaseitemid", referencedColumnName = "id")
    private PurchaseItems purchaseItems;

    @Column(name = "barcodedatetime")
    private LocalDateTime barcodedatetime;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "print_count")
    private Integer printCount;

    @Column(name = "generated_by", length = 100)
    private String generatedBy;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt;

    @PrePersist
    public void prePersist() {
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.printCount == null) {
            this.printCount = 0;
        }
        if (this.generatedAt == null) {
            this.generatedAt = LocalDateTime.now();
        }
        if (this.barcodedatetime == null) {
            this.barcodedatetime = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public String getBarcodeValue() { return barcodeValue; }
    public void setBarcodeValue(String barcodeValue) { this.barcodeValue = barcodeValue; }

    public PurchaseItems getPurchaseItems() { return purchaseItems; }
    public void setPurchaseItems(PurchaseItems purchaseItems) { this.purchaseItems = purchaseItems; }

    public LocalDateTime getBarcodedatetime() { return barcodedatetime; }
    public void setBarcodedatetime(LocalDateTime barcodedatetime) { this.barcodedatetime = barcodedatetime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getPrintCount() { return printCount; }
    public void setPrintCount(Integer printCount) { this.printCount = printCount; }

    public String getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(String generatedBy) { this.generatedBy = generatedBy; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}

