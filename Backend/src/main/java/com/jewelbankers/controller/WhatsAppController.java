package com.jewelbankers.controller;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jewelbankers.aop.SwitchDatabase;
import com.jewelbankers.entity.Bill;
import com.jewelbankers.entity.Sales;
import com.jewelbankers.services.BillService;
import com.jewelbankers.services.SalesService;
import com.jewelbankers.services.WhatsAppService;

@RestController
@RequestMapping("/jewelbankersapi/whatsapp")
@CrossOrigin(origins = "*")
public class WhatsAppController {

    @Autowired
    private WhatsAppService whatsAppService;

    @Autowired
    private BillService billService;

    @Autowired(required = false)
    private SalesService salesService;

    @Value("${whatsapp.service.url:http://localhost:3001/message/send}")
    private String serviceUrl;

    /**
     * Check status of the WhatsApp Headless Protocol Engine
     */
    @GetMapping("/status")
    public ResponseEntity<?> getWhatsAppStatus() {
        try {
            String baseUrl = serviceUrl.replace("/message/send", "/status");
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(baseUrl)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return ResponseEntity.status(response.statusCode()).body(response.body());
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("connected", false);
            error.put("status", "OFFLINE");
            error.put("error", "WhatsApp headless service is offline or unreachable: " + e.getMessage());
            error.put("help", "Run start-whatsapp.bat in the project directory to launch the Baileys engine.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }
    }

    /**
     * Send or re-send Pledge notification for a specific bill
     */
    @PostMapping("/send-pledge/{billSequence}")
    @SwitchDatabase
    public ResponseEntity<?> resendPledgeReceipt(@PathVariable Long billSequence) {
        Optional<Bill> billOpt = billService.findById(billSequence);
        if (billOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Bill not found with sequence: " + billSequence));
        }

        whatsAppService.sendPledgeConfirmationAsync(billOpt.get());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Pledge WhatsApp notification triggered for Bill: " + billOpt.get().getBillNo()
        ));
    }

    /**
     * Send or re-send Redeem notification for a specific bill
     */
    @PostMapping("/send-redeem/{billSequence}")
    @SwitchDatabase
    public ResponseEntity<?> resendRedeemReceipt(@PathVariable Long billSequence) {
        Optional<Bill> billOpt = billService.findById(billSequence);
        if (billOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Bill not found with sequence: " + billSequence));
        }

        whatsAppService.sendRedeemConfirmationAsync(billOpt.get());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Redeem WhatsApp notification triggered for Bill: " + billOpt.get().getBillNo()
        ));
    }

    /**
     * Send or re-send Jewellery Purchase receipt for a specific sale
     */
    @PostMapping("/send-sale/{salesId}")
    @SwitchDatabase
    public ResponseEntity<?> resendSaleReceipt(@PathVariable Long salesId) {
        if (salesService == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "SalesService is not available"));
        }
        Sales sales = salesService.getSalesById(salesId);
        if (sales == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Sales record not found with ID: " + salesId));
        }

        whatsAppService.sendJewellerySaleConfirmationAsync(sales);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Jewellery Sale WhatsApp receipt triggered for Invoice: " + 
                (sales.getInvoiceNumber() != null ? sales.getInvoiceNumber() : sales.getId())
        ));
    }

    /**
     * Test send custom text to any number
     */
    @PostMapping("/send-test")
    public ResponseEntity<?> sendTestMessage(@RequestBody Map<String, String> payload) {
        String number = payload.get("number");
        String message = payload.get("message");

        if (number == null || number.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mobile number is required"));
        }
        if (message == null || message.isBlank()) {
            message = "✨ JewelBankers WhatsApp Protocol Engine Test ✨\nThis is a test notification from JewelBankers backend.";
        }

        whatsAppService.sendWhatsAppMessageAsync(number, message);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Test message queued for dispatch to " + number
        ));
    }
}
