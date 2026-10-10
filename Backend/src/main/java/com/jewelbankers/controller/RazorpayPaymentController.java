package com.jewelbankers.controller;

import com.jewelbankers.dto.PaymentDto.*;
import com.jewelbankers.entity.PaymentTransaction;
import com.jewelbankers.services.RazorpayPaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/jewelbankersapi/api/payment")
public class RazorpayPaymentController {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayPaymentController.class);

    @Autowired
    private RazorpayPaymentService razorpayService;

    /**
     * Create Razorpay order and generate dynamic UPI QR code string
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody CreateOrderRequest request) {
        try {
            CreateOrderResponse response = razorpayService.createOrder(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            logger.error("Error creating payment order: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to create payment order: " + e.getMessage()));
        }
    }

    /**
     * Verify payment signature, record status in DB, and activate subscription / sale
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody VerifyPaymentRequest request) {
        try {
            PaymentResultResponse result = razorpayService.verifyPayment(request);
            if (result.isSuccess()) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
            }
        } catch (Exception e) {
            logger.error("Error verifying payment: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error verifying payment: " + e.getMessage()));
        }
    }

    /**
     * Check payment status by orderId (for automated real-time polling while scanner is open)
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String orderId) {
        try {
            PaymentResultResponse status = razorpayService.getPaymentStatus(orderId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("Error checking order status: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Error checking payment status: " + e.getMessage()));
        }
    }

    /**
     * Get recent payment history for audit or user
     */
    @GetMapping("/history")
    public ResponseEntity<List<PaymentTransaction>> getPaymentHistory(@RequestParam(required = false) Long userId) {
        try {
            List<PaymentTransaction> list = razorpayService.getPaymentHistory(userId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            logger.error("Error retrieving payment history: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Webhook listener for asynchronous server-to-server Razorpay events
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody String payload,
                                          @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        logger.info("Received Razorpay Webhook notification");
        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
