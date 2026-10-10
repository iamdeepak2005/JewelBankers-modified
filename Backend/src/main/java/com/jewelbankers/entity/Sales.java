package com.jewelbankers.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(name = "sales")
public class Sales {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER, cascade = {CascadeType.DETACH})
    @JoinColumn(name = "customerid", referencedColumnName = "customerid")
    private Customer customer;
    
    
    @JsonManagedReference("sales-items")
    @OneToMany(mappedBy = "sales", cascade = CascadeType.ALL)
    private List<SalesItems> salesItems = new ArrayList<>();

    @Column(name = "billno")
    private Long billno;
    
    @Column(name = "billprefix")
    private String billprefix;
    
    @Column(name = "billdate")
    private LocalDateTime billdate;
    
    @Column(name = "paymenttype")
    private String paymenttype;
    
    @Column(name = "salesman")
    private String salesman;
    
    @Column(name = "billduedatetime")
    private LocalDateTime billduedatetime;

    @Column(name = "billamount")
    private BigDecimal billamount;
    
    @Column(name = "gstamount")
    private double gstamount;
    
    @Column(name = "billdiscount")
    private double billdiscount;
    
    @Column(name = "totalamount")
    private double totalamount;
    
    @Column(name = "paymentsubtype")
    private String paymentsubtype;
    
    @Column(name = "paymentrefno")
    private String paymentrefno;
    
    @Column(name = "paymentrecieved")
    private BigDecimal paytmentrecieved;
    
    @Column(name = "paymentbalanceamt")
    private BigDecimal paymentbalanceamt;
    
    @Column(name = "paymentseqno")
    private Long paymentseqno;

    @Column(name = "invoicenumber")
    private String invoiceNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private com.jewelbankers.enums.SaleStatus status;

    @Column(name = "oldgoldamount", precision = 15, scale = 2)
    private BigDecimal oldGoldAmount;

    @Column(name = "roundoff", precision = 10, scale = 2)
    private BigDecimal roundOff;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "subtotal", precision = 15, scale = 2)
    private BigDecimal subTotal;

    @Column(name = "taxableamount", precision = 15, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "sgstamount", precision = 12, scale = 2)
    private BigDecimal sgstAmount;

    @Column(name = "cgstamount", precision = 12, scale = 2)
    private BigDecimal cgstAmount;

    @Column(name = "igstamount", precision = 12, scale = 2)
    private BigDecimal igstAmount;

    @Column(name = "cashamount", precision = 15, scale = 2)
    private BigDecimal cashAmount;

    @Column(name = "cardamount", precision = 15, scale = 2)
    private BigDecimal cardAmount;

    @Column(name = "upiamount", precision = 15, scale = 2)
    private BigDecimal upiAmount;

    @Column(name = "bankamount", precision = 15, scale = 2)
    private BigDecimal bankAmount;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Customer getCustomer() {
		return customer;
	}

	public void setCustomer(Customer customer) {
		this.customer = customer;
	}

	public List<SalesItems> getSalesItems() {
		return salesItems;
	}

	public void setSalesItems(List<SalesItems> salesItems) {
		this.salesItems = salesItems;
	}

	public Long getBillno() {
		return billno;
	}

	public void setBillno(Long billno) {
		this.billno = billno;
	}

	public String getBillprefix() {
		return billprefix;
	}

	public void setBillprefix(String billprefix) {
		this.billprefix = billprefix;
	}

	public LocalDateTime getBilldate() {
		return billdate;
	}

	public void setBilldate(LocalDateTime billdate) {
		this.billdate = billdate;
	}

	public String getPaymenttype() {
		return paymenttype;
	}

	public void setPaymenttype(String paymenttype) {
		this.paymenttype = paymenttype;
	}

	public String getSalesman() {
		return salesman;
	}

	public void setSalesman(String salesman) {
		this.salesman = salesman;
	}

	public LocalDateTime getBillduedatetime() {
		return billduedatetime;
	}

	public void setBillduedatetime(LocalDateTime billduedatetime) {
		this.billduedatetime = billduedatetime;
	}

	public BigDecimal getBillamount() {
		return billamount;
	}

	public void setBillamount(BigDecimal billamount) {
		this.billamount = billamount;
	}

	public double getGstamount() {
		return gstamount;
	}

	public void setGstamount(double gstamount) {
		this.gstamount = gstamount;
	}

	public double getBilldiscount() {
		return billdiscount;
	}

	public void setBilldiscount(double billdiscount) {
		this.billdiscount = billdiscount;
	}

	public double getTotalamount() {
		return totalamount;
	}

	public void setTotalamount(double totalamount) {
		this.totalamount = totalamount;
	}

	public String getPaymentsubtype() {
		return paymentsubtype;
	}

	public void setPaymentsubtype(String paymentsubtype) {
		this.paymentsubtype = paymentsubtype;
	}

	public String getPaymentrefno() {
		return paymentrefno;
	}

	public void setPaymentrefno(String paymentrefno) {
		this.paymentrefno = paymentrefno;
	}

	public BigDecimal getPaytmentrecieved() {
		return paytmentrecieved;
	}

	public void setPaytmentrecieved(BigDecimal paytmentrecieved) {
		this.paytmentrecieved = paytmentrecieved;
	}

	public BigDecimal getPaymentbalanceamt() {
		return paymentbalanceamt;
	}

	public void setPaymentbalanceamt(BigDecimal paymentbalanceamt) {
		this.paymentbalanceamt = paymentbalanceamt;
	}

	public Long getPaymentseqno() {
		return paymentseqno;
	}

	public void setPaymentseqno(Long paymentseqno) {
		this.paymentseqno = paymentseqno;
	}

	public String getInvoiceNumber() {
		return invoiceNumber;
	}

	public void setInvoiceNumber(String invoiceNumber) {
		this.invoiceNumber = invoiceNumber;
	}

	public com.jewelbankers.enums.SaleStatus getStatus() {
		return status;
	}

	public void setStatus(com.jewelbankers.enums.SaleStatus status) {
		this.status = status;
	}

	public BigDecimal getOldGoldAmount() {
		return oldGoldAmount;
	}

	public void setOldGoldAmount(BigDecimal oldGoldAmount) {
		this.oldGoldAmount = oldGoldAmount;
	}

	public BigDecimal getRoundOff() {
		return roundOff;
	}

	public void setRoundOff(BigDecimal roundOff) {
		this.roundOff = roundOff;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public BigDecimal getSubTotal() {
		return subTotal;
	}

	public void setSubTotal(BigDecimal subTotal) {
		this.subTotal = subTotal;
	}

	public BigDecimal getTaxableAmount() {
		return taxableAmount;
	}

	public void setTaxableAmount(BigDecimal taxableAmount) {
		this.taxableAmount = taxableAmount;
	}

	public BigDecimal getSgstAmount() {
		return sgstAmount;
	}

	public void setSgstAmount(BigDecimal sgstAmount) {
		this.sgstAmount = sgstAmount;
	}

	public BigDecimal getCgstAmount() {
		return cgstAmount;
	}

	public void setCgstAmount(BigDecimal cgstAmount) {
		this.cgstAmount = cgstAmount;
	}

	public BigDecimal getIgstAmount() {
		return igstAmount;
	}

	public void setIgstAmount(BigDecimal igstAmount) {
		this.igstAmount = igstAmount;
	}

	public BigDecimal getCashAmount() {
		return cashAmount;
	}

	public void setCashAmount(BigDecimal cashAmount) {
		this.cashAmount = cashAmount;
	}

	public BigDecimal getCardAmount() {
		return cardAmount;
	}

	public void setCardAmount(BigDecimal cardAmount) {
		this.cardAmount = cardAmount;
	}

	public BigDecimal getUpiAmount() {
		return upiAmount;
	}

	public void setUpiAmount(BigDecimal upiAmount) {
		this.upiAmount = upiAmount;
	}

	public BigDecimal getBankAmount() {
		return bankAmount;
	}

	public void setBankAmount(BigDecimal bankAmount) {
		this.bankAmount = bankAmount;
	}
    
}
