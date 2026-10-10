package com.jewelbankers.services;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.jewelbankers.entity.Bill;
import com.jewelbankers.entity.BillDetail;
import com.jewelbankers.entity.Customer;
import com.jewelbankers.entity.Sales;
import com.jewelbankers.entity.SalesItems;

/**
 * Ultra-Low Latency (~50ms - 150ms) Headless Protocol WhatsApp Service.
 * Interacts directly with the local Baileys Protocol Engine microservice
 * to deliver automated WhatsApp receipts for Pledges and Redemptions.
 */
@Service
public class WhatsAppService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    @Value("${whatsapp.service.url:http://localhost:3001/message/send}")
    private String serviceUrl;

    @Value("${whatsapp.service.enabled:true}")
    private boolean enabled;

    @Value("${whatsapp.default.country-code:91}")
    private String defaultCountryCode;

    @Autowired
    private SettingsService settingsService;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public WhatsAppService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Clean and normalize raw phone number to pure digits with country code.
     * E.g. "9876543210" -> "919876543210"
     */
    public String sanitizePhoneNumber(String rawNumber) {
        if (rawNumber == null) return null;
        String digits = rawNumber.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            digits = defaultCountryCode + digits;
        }
        if (digits.length() < 10 || digits.length() > 15) {
            return null;
        }
        return digits;
    }

    /**
     * Low-level send method via HTTP POST to the Headless Protocol Engine.
     */
    public CompletableFuture<Boolean> sendWhatsAppMessageAsync(String rawNumber, String messageBody) {
        if (!enabled) {
            log.info("WhatsApp notifications are disabled (whatsapp.service.enabled=false). Message skipped.");
            return CompletableFuture.completedFuture(false);
        }

        String phone = sanitizePhoneNumber(rawNumber);
        if (phone == null) {
            log.warn("Invalid phone number '{}'. WhatsApp message skipped.", rawNumber);
            return CompletableFuture.completedFuture(false);
        }

        if (messageBody == null || messageBody.isBlank()) {
            log.warn("Empty message body for phone '{}'. WhatsApp message skipped.", phone);
            return CompletableFuture.completedFuture(false);
        }

        return CompletableFuture.supplyAsync(() -> {
            try {
                ObjectNode jsonNode = objectMapper.createObjectNode();
                jsonNode.put("number", phone);
                jsonNode.put("message", messageBody);
                String requestJson = objectMapper.writeValueAsString(jsonNode);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(serviceUrl))
                        .timeout(Duration.ofSeconds(6))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                        .build();

                long startTime = System.currentTimeMillis();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                long latency = System.currentTimeMillis() - startTime;

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ WhatsApp message dispatched in {}ms to {} (Status: {})", latency, phone, response.statusCode());
                    return true;
                } else {
                    log.error("❌ WhatsApp send failed (HTTP {}): {} (Latency: {}ms)", response.statusCode(), response.body(), latency);
                    return false;
                }
            } catch (Exception e) {
                log.error("❌ Failed to reach WhatsApp Headless Engine at {}: {}", serviceUrl, e.getMessage());
                return false;
            }
        });
    }

    /**
     * Send automated WhatsApp notification for newly PLEDGED bill.
     */
    public CompletableFuture<Boolean> sendPledgeConfirmationAsync(Bill bill) {
        if (bill == null || bill.getCustomer() == null) {
            log.warn("Bill or Customer is null. Cannot send pledge WhatsApp message.");
            return CompletableFuture.completedFuture(false);
        }

        Customer customer = bill.getCustomer();
        String customerPhone = extractCustomerPhone(customer);
        if (customerPhone == null) {
            log.info("Customer has no valid phone/mobile number. Pledge WhatsApp message skipped.");
            return CompletableFuture.completedFuture(false);
        }

        String shopName = getShopName();
        String shopAddress = getShopAddress();

        StringBuilder sb = new StringBuilder();
        sb.append("✨ *").append(shopName).append("* ✨\n");
        sb.append("🧾 *GOLD LOAN / PLEDGE RECEIPT*\n\n");
        sb.append("Dear *").append(customer.getCustomerName() != null ? customer.getCustomerName().trim() : "Valued Customer").append("*,\n");
        sb.append("Your gold loan has been successfully processed & disbursed.\n\n");

        sb.append("📌 *Bill No:* ").append(bill.getBillSerial() != null ? bill.getBillSerial() : "")
          .append(bill.getBillNo() != null ? bill.getBillNo() : "").append("\n");

        if (bill.getBillDate() != null) {
            sb.append("📅 *Date:* ").append(bill.getBillDate().format(DATE_FMT)).append("\n");
        }

        if (bill.getAmount() != null) {
            sb.append("💰 *Loan Amount:* ₹").append(String.format("%,d", bill.getAmount())).append("\n");
        }

        if (bill.getGrams() != null) {
            sb.append("⚖️ *Gross Weight:* ").append(bill.getGrams()).append(" gms\n");
        }

        // List pledged items
        List<BillDetail> details = bill.getBillDetails();
        if (details != null && !details.isEmpty()) {
            sb.append("\n📦 *Pledged Items:*\n");
            for (BillDetail d : details) {
                String desc = d.getProductDescription() != null ? d.getProductDescription().trim() : "Gold Article";
                int qty = d.getProductQuantity();
                sb.append(" • ").append(desc);
                if (qty > 0) sb.append(" (Qty: ").append(qty).append(")");
                sb.append("\n");
            }
        }

        sb.append("\n📍 *Address:* ").append(shopAddress).append("\n");
        sb.append("🙏 _Thank you for your trust!_\n");

        return sendWhatsAppMessageAsync(customerPhone, sb.toString());
    }

    /**
     * Send automated WhatsApp notification for REDEEMED / CLOSED bill.
     * Note: Sensitive financial figures (rate of interest, interest paid, total amount paid)
     * are intentionally excluded per requirements.
     */
    public CompletableFuture<Boolean> sendRedeemConfirmationAsync(Bill bill) {
        if (bill == null || bill.getCustomer() == null) {
            log.warn("Bill or Customer is null. Cannot send redeem WhatsApp message.");
            return CompletableFuture.completedFuture(false);
        }

        Customer customer = bill.getCustomer();
        String customerPhone = extractCustomerPhone(customer);
        if (customerPhone == null) {
            log.info("Customer has no valid phone/mobile number. Redeem WhatsApp message skipped.");
            return CompletableFuture.completedFuture(false);
        }

        String shopName = getShopName();
        String shopAddress = getShopAddress();

        StringBuilder sb = new StringBuilder();
        sb.append("✨ *").append(shopName).append("* ✨\n");
        sb.append("✅ *SETTLEMENT & REDEMPTION RECEIPT*\n\n");
        sb.append("Dear *").append(customer.getCustomerName() != null ? customer.getCustomerName().trim() : "Valued Customer").append("*,\n");
        sb.append("Your pledge bill has been successfully *REDEEMED and CLOSED*. All pledged gold items have been safely returned to you.\n\n");

        sb.append("📌 *Original Bill No:* ").append(bill.getBillSerial() != null ? bill.getBillSerial() : "")
          .append(bill.getBillNo() != null ? bill.getBillNo() : "").append("\n");

        if (bill.getBillRedemNo() != null && bill.getBillRedemNo() > 0) {
            sb.append("🔖 *Redeem Bill No:* ").append(bill.getBillRedemSerial() != null ? bill.getBillRedemSerial() : "")
              .append(bill.getBillRedemNo()).append("\n");
        }

        if (bill.getRedemptionDate() != null) {
            sb.append("📅 *Redemption Date:* ").append(bill.getRedemptionDate().format(DATE_FMT)).append("\n");
        }

        // List returned items
        List<BillDetail> details = bill.getBillDetails();
        if (details != null && !details.isEmpty()) {
            sb.append("\n📦 *Returned Items:*\n");
            for (BillDetail d : details) {
                String desc = d.getProductDescription() != null ? d.getProductDescription().trim() : "Gold Article";
                int qty = d.getProductQuantity();
                sb.append(" • ").append(desc);
                if (qty > 0) sb.append(" (Qty: ").append(qty).append(")");
                sb.append("\n");
            }
        }

        sb.append("📦 *Delivery Status:* Jewels Delivered & Handed Over in Full\n");
        if (shopAddress != null && !shopAddress.isBlank()) {
            sb.append("📍 *Address:* ").append(shopAddress).append("\n");
        }
        sb.append("\n🙏 _Thank you for transacting with ").append(shopName).append("!_\n");

        return sendWhatsAppMessageAsync(customerPhone, sb.toString());
    }

    /**
     * Send automated WhatsApp notification for JEWELLERY SALE (POS purchase).
     * Includes all details of purchased jewels (item name, weight, purity, HUID, amount),
     * invoice number, old gold deduction, net total, and payment mode.
     */
    public CompletableFuture<Boolean> sendJewellerySaleConfirmationAsync(Sales sales) {
        if (sales == null) {
            log.warn("Sales record is null. Cannot send jewellery sale WhatsApp message.");
            return CompletableFuture.completedFuture(false);
        }

        Customer customer = sales.getCustomer();
        if (customer == null) {
            log.info("Sale #{} has no customer attached. WhatsApp message skipped.", sales.getInvoiceNumber());
            return CompletableFuture.completedFuture(false);
        }

        String customerPhone = extractCustomerPhone(customer);
        if (customerPhone == null) {
            log.info("Customer for Sale #{} has no valid phone/mobile number. WhatsApp message skipped.", sales.getInvoiceNumber());
            return CompletableFuture.completedFuture(false);
        }

        String shopName = getShopName();
        String shopAddress = getShopAddress();

        StringBuilder sb = new StringBuilder();
        sb.append("✨ *").append(shopName).append("* ✨\n");
        sb.append("💎 *JEWELLERY PURCHASE INVOICE* 💎\n\n");

        sb.append("Dear *").append(customer.getCustomerName() != null ? customer.getCustomerName().trim() : "Valued Customer").append("*,\n");
        sb.append("Thank you for your purchase with us! Here are your jewellery purchase details:\n\n");

        String invoiceNo = sales.getInvoiceNumber();
        if (invoiceNo == null || invoiceNo.isBlank()) {
            invoiceNo = (sales.getBillprefix() != null ? sales.getBillprefix() : "") + 
                        (sales.getBillno() != null ? sales.getBillno() : sales.getId());
        }
        sb.append("🧾 *Invoice No:* ").append(invoiceNo).append("\n");

        if (sales.getBilldate() != null) {
            sb.append("📅 *Date:* ").append(sales.getBilldate().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a"))).append("\n");
        }

        // List Purchased Jewels
        List<SalesItems> items = sales.getSalesItems();
        if (items != null && !items.isEmpty()) {
            sb.append("\n🛍️ *Purchased Jewels:*\n");
            int idx = 1;
            double totalGrossWt = 0;
            double totalNetWt = 0;

            for (SalesItems item : items) {
                String name = item.getItemName() != null && !item.getItemName().isBlank() ? item.getItemName().trim() : "Gold Jewellery";
                sb.append(idx++).append(". *").append(name).append("*\n");

                if (item.getPurity() > 0) {
                    sb.append("   • Purity: ").append(String.format("%.1f", item.getPurity())).append("%");
                    if (item.getPurity() >= 91.0 && item.getPurity() <= 92.5) {
                        sb.append(" (22K 916)");
                    } else if (item.getPurity() >= 74.0 && item.getPurity() <= 76.0) {
                        sb.append(" (18K 750)");
                    } else if (item.getPurity() >= 99.0) {
                        sb.append(" (24K Fine)");
                    }
                    sb.append("\n");
                }

                if (item.getGrosswt() > 0) {
                    sb.append("   • Gross Wt: ").append(String.format("%.3f", item.getGrosswt())).append(" g");
                    totalGrossWt += item.getGrosswt();
                    if (item.getNetwt() > 0 && Math.abs(item.getNetwt() - item.getGrosswt()) > 0.001) {
                        sb.append(" | Net Wt: ").append(String.format("%.3f", item.getNetwt())).append(" g");
                    }
                    sb.append("\n");
                }
                if (item.getNetwt() > 0) {
                    totalNetWt += item.getNetwt();
                }

                if (item.getHuid() != null && !item.getHuid().isBlank()) {
                    sb.append("   • Hallmark HUID: ").append(item.getHuid().trim()).append("\n");
                }

                if (item.getTotalAmount() != null && item.getTotalAmount().doubleValue() > 0) {
                    sb.append("   • Amount: ₹").append(String.format("%,.2f", item.getTotalAmount())).append("\n");
                } else if (item.getAmount() != null && item.getAmount().doubleValue() > 0) {
                    sb.append("   • Amount: ₹").append(String.format("%,.2f", item.getAmount())).append("\n");
                }
            }

            if (items.size() > 1 && totalGrossWt > 0) {
                sb.append("\n⚖️ *Total Items Weight:* ").append(String.format("%.3f", totalGrossWt)).append(" g\n");
            }
        }

        sb.append("\n💰 *PAYMENT SUMMARY:*\n");
        if (sales.getBillamount() != null && sales.getBillamount().doubleValue() > 0) {
            sb.append("• Subtotal: ₹").append(String.format("%,.2f", sales.getBillamount())).append("\n");
        }

        if (sales.getGstamount() > 0) {
            sb.append("• GST: ₹").append(String.format("%,.2f", sales.getGstamount())).append("\n");
        }

        if (sales.getOldGoldAmount() != null && sales.getOldGoldAmount().doubleValue() > 0) {
            sb.append("• Old Gold Adjustment: -₹").append(String.format("%,.2f", sales.getOldGoldAmount())).append("\n");
        }

        if (sales.getBilldiscount() > 0) {
            sb.append("• Discount: -₹").append(String.format("%,.2f", sales.getBilldiscount())).append("\n");
        }

        double finalTotal = sales.getTotalamount() > 0 ? sales.getTotalamount() : 
            (sales.getBillamount() != null ? sales.getBillamount().doubleValue() : 0.0);
        sb.append("💵 *Net Amount Paid:* ₹").append(String.format("%,.2f", finalTotal)).append("\n");

        if (sales.getPaymenttype() != null && !sales.getPaymenttype().isBlank()) {
            sb.append("💳 *Payment Mode:* ").append(sales.getPaymenttype().trim()).append("\n");
        }

        if (shopAddress != null && !shopAddress.isBlank()) {
            sb.append("\n📍 *Store:* ").append(shopAddress).append("\n");
        }
        sb.append("🙏 _Thank you for shopping at ").append(shopName).append("! Visit again._\n");

        return sendWhatsAppMessageAsync(customerPhone, sb.toString());
    }

    private String extractCustomerPhone(Customer customer) {
        if (customer.getMobileno() != null && customer.getMobileno() > 0) {
            return String.valueOf(customer.getMobileno());
        }
        if (customer.getPhoneno() != null && customer.getPhoneno() > 0) {
            return String.valueOf(customer.getPhoneno());
        }
        return null;
    }

    private String getShopName() {
        try {
            Map<String, String> details = settingsService.getShopDetails();
            String name = details.get("SHOP_NAME");
            if (name != null && !name.isBlank()) {
                return name.trim();
            }
        } catch (Exception ignored) {}
        return "JewelBankers";
    }

    private String getShopAddress() {
        try {
            Map<String, String> details = settingsService.getShopDetails();
            String street = details.getOrDefault("SHOP_STREET", "");
            String city = details.getOrDefault("SHOP_CITY", "");
            String pincode = details.getOrDefault("SHOP_PINCODE", "");
            StringBuilder addr = new StringBuilder();
            if (!street.isBlank()) addr.append(street).append(", ");
            if (!city.isBlank()) addr.append(city).append(" ");
            if (!pincode.isBlank()) addr.append("- ").append(pincode);
            if (addr.length() > 0) return addr.toString().trim();
        } catch (Exception ignored) {}
        return "Jewellers & Pawnbrokers";
    }
}
