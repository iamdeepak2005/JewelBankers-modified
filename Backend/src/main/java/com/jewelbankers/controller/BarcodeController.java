package com.jewelbankers.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import com.jewelbankers.entity.Barcode;
import com.jewelbankers.entity.PurchaseItems;
import com.jewelbankers.repository.BarcodeRepository;
import com.jewelbankers.repository.PurchaseItemsRepository;
import com.jewelbankers.services.BarcodeGenerationService;
import com.jewelbankers.services.BarcodeImagePrinter;

@RestController
@RequestMapping("/jewelbankersapi/barcodes")
@CrossOrigin(origins = "*")
@SwitchDatabase
public class BarcodeController {

    @Autowired
    private BarcodeGenerationService barcodeGenerationService;

    @Autowired
    private BarcodeRepository barcodeRepository;

    @Autowired
    private PurchaseItemsRepository purchaseItemsRepository;

    /**
     * Lookup barcode by exact code value (e.g. for barcode scanner scan)
     */
    @GetMapping("/lookup/{barcodeValue}")
    public ResponseEntity<?> lookupBarcode(@PathVariable String barcodeValue) {
        Optional<Barcode> barcodeOpt = barcodeGenerationService.lookupBarcode(barcodeValue);
        if (barcodeOpt.isPresent()) {
            Barcode b = barcodeOpt.get();
            return ResponseEntity.ok(b);
        }
        // Fallback: search purchase items by barcode string directly
        List<PurchaseItems> items = purchaseItemsRepository.findAll();
        for (PurchaseItems pi : items) {
            if (pi.getBarcode() != null && barcodeValue.equalsIgnoreCase(pi.getBarcode().getBarcodeValue())) {
                return ResponseEntity.ok(pi.getBarcode());
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Barcode not found: " + barcodeValue));
    }

    /**
     * Generate barcode image bytes (JPEG) for thermal printing or UI display
     */
    @GetMapping("/image/{barcodeValue}")
    public ResponseEntity<byte[]> getBarcodeImage(@PathVariable String barcodeValue) {
        try {
            byte[] imageBytes = BarcodeImagePrinter.generateBarcodeImage(barcodeValue);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.IMAGE_JPEG);
            return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generate barcode for a specific purchase item
     */
    @PostMapping("/generate/{purchaseItemId}")
    public ResponseEntity<?> generateForPurchaseItem(
            @PathVariable Long purchaseItemId,
            @RequestParam(defaultValue = "ADMIN") String generatedBy) {
        Optional<PurchaseItems> itemOpt = purchaseItemsRepository.findById(purchaseItemId);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "PurchaseItem not found: " + purchaseItemId));
        }

        PurchaseItems item = itemOpt.get();
        Barcode barcode = barcodeGenerationService.generateForPurchaseItem(item, generatedBy);
        item.setBarcode(barcode);
        purchaseItemsRepository.save(item);
        return ResponseEntity.ok(barcode);
    }

    /**
     * Mark barcode printed and increment print counter
     */
    @PostMapping("/mark-printed/{barcodeValue}")
    public ResponseEntity<?> markPrinted(@PathVariable String barcodeValue) {
        barcodeGenerationService.incrementPrintCount(barcodeValue);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "barcode", barcodeValue));
    }

    /**
     * Void a barcode
     */
    @PostMapping("/void/{barcodeValue}")
    public ResponseEntity<?> voidBarcode(@PathVariable String barcodeValue) {
        boolean voided = barcodeGenerationService.voidBarcode(barcodeValue);
        if (voided) {
            return ResponseEntity.ok(Map.of("status", "VOIDED", "barcode", barcodeValue));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Barcode could not be voided"));
    }

    /**
     * List all barcodes
     */
    @GetMapping("/list")
    public ResponseEntity<List<Barcode>> listBarcodes() {
        return ResponseEntity.ok(barcodeRepository.findAll());
    }
}
