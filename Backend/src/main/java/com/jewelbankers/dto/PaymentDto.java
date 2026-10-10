package com.jewelbankers.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PaymentDto {

    public static class CreateOrderRequest {
        private BigDecimal amount;
        private String currency = "INR";
        private String planName;
        private Integer planDays;
        private Long userId;
        private String username;
        private String userEmail;
        private String paymentType = "SUBSCRIPTION"; // SUBSCRIPTION, POS_SALE, CUSTOM
        private String referenceId; // e.g. Bill No / Sales invoice
        private String notes;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }

        public String getPlanName() { return planName; }
        public void setPlanName(String planName) { this.planName = planName; }

        public Integer getPlanDays() { return planDays; }
        public void setPlanDays(Integer planDays) { this.planDays = planDays; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getUserEmail() { return userEmail; }
        public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

        public String getPaymentType() { return paymentType; }
        public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

        public String getReferenceId() { return referenceId; }
        public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class CreateOrderResponse {
        private String orderId;
        private BigDecimal amount;
        private Long amountInPaise;
        private String currency;
        private String keyId;
        private String companyName;
        private String upiString;
        private String planName;
        private Integer planDays;
        private String status;

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public Long getAmountInPaise() { return amountInPaise; }
        public void setAmountInPaise(Long amountInPaise) { this.amountInPaise = amountInPaise; }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }

        public String getKeyId() { return keyId; }
        public void setKeyId(String keyId) { this.keyId = keyId; }

        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }

        public String getUpiString() { return upiString; }
        public void setUpiString(String upiString) { this.upiString = upiString; }

        public String getPlanName() { return planName; }
        public void setPlanName(String planName) { this.planName = planName; }

        public Integer getPlanDays() { return planDays; }
        public void setPlanDays(Integer planDays) { this.planDays = planDays; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class VerifyPaymentRequest {
        private String orderId;
        private String paymentId;
        private String signature;
        private String paymentMethod; // UPI, CARD, etc.

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

        public String getSignature() { return signature; }
        public void setSignature(String signature) { this.signature = signature; }

        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }

    public static class PaymentResultResponse {
        private boolean success;
        private String message;
        private String orderId;
        private String paymentId;
        private String status;
        private BigDecimal amount;
        private LocalDate newEndDate;
        private Integer daysLeft;
        private LocalDateTime paidAt;

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }

        public String getPaymentId() { return paymentId; }
        public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }

        public LocalDate getNewEndDate() { return newEndDate; }
        public void setNewEndDate(LocalDate newEndDate) { this.newEndDate = newEndDate; }

        public Integer getDaysLeft() { return daysLeft; }
        public void setDaysLeft(Integer daysLeft) { this.daysLeft = daysLeft; }

        public LocalDateTime getPaidAt() { return paidAt; }
        public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    }
}
