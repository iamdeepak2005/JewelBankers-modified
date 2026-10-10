package com.jewelbankers.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO for fuzzy customer search results with similarity scoring.
 */
public class CustomerSearchResult {
    private Long customerid;
    private String customerName;
    private String address;
    private String area;
    private String street;
    private String district;
    private String state;
    private Long phoneno;
    private Long mobileno;
    private String mailid;
    private int pincode;
    
    // Similarity scoring
    private double similarityScore; // 0.0 to 1.0
    private String matchCategory; // "EXACT", "STRONG", "POSSIBLE", "WEAK"
    
    // Transaction summary
    private int openPledgeCount;
    private int redeemedPledgeCount;
    private int cancelledPledgeCount;
    private int totalPledgeCount;
    private int jewelleryPurchaseCount;

    public CustomerSearchResult() {}

    // Getters and Setters
    public Long getCustomerid() { return customerid; }
    public void setCustomerid(Long customerid) { this.customerid = customerid; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public Long getPhoneno() { return phoneno; }
    public void setPhoneno(Long phoneno) { this.phoneno = phoneno; }

    public Long getMobileno() { return mobileno; }
    public void setMobileno(Long mobileno) { this.mobileno = mobileno; }

    public String getMailid() { return mailid; }
    public void setMailid(String mailid) { this.mailid = mailid; }

    public int getPincode() { return pincode; }
    public void setPincode(int pincode) { this.pincode = pincode; }

    public double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(double similarityScore) { this.similarityScore = similarityScore; }

    public String getMatchCategory() { return matchCategory; }
    public void setMatchCategory(String matchCategory) { this.matchCategory = matchCategory; }

    public int getOpenPledgeCount() { return openPledgeCount; }
    public void setOpenPledgeCount(int openPledgeCount) { this.openPledgeCount = openPledgeCount; }

    public int getRedeemedPledgeCount() { return redeemedPledgeCount; }
    public void setRedeemedPledgeCount(int redeemedPledgeCount) { this.redeemedPledgeCount = redeemedPledgeCount; }

    public int getCancelledPledgeCount() { return cancelledPledgeCount; }
    public void setCancelledPledgeCount(int cancelledPledgeCount) { this.cancelledPledgeCount = cancelledPledgeCount; }

    public int getTotalPledgeCount() { return totalPledgeCount; }
    public void setTotalPledgeCount(int totalPledgeCount) { this.totalPledgeCount = totalPledgeCount; }

    public int getJewelleryPurchaseCount() { return jewelleryPurchaseCount; }
    public void setJewelleryPurchaseCount(int jewelleryPurchaseCount) { this.jewelleryPurchaseCount = jewelleryPurchaseCount; }
}
