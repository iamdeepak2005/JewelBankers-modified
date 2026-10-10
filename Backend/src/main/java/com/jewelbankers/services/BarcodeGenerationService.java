package com.jewelbankers.services;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jewelbankers.entity.Barcode;
import com.jewelbankers.entity.PurchaseItems;
import com.jewelbankers.repository.BarcodeRepository;

import jakarta.annotation.PostConstruct;

/**
 * Service for generating unique barcode values for jewellery items.
 * Format: JW + 9-digit sequential number (e.g., JW000000001)
 */
@Service
public class BarcodeGenerationService {

    private static final String BARCODE_PREFIX = "JW";
    private static final int BARCODE_NUMBER_LENGTH = 9;

    @Autowired
    private BarcodeRepository barcodeRepository;

    private AtomicLong counter;

    @PostConstruct
    public void init() {
        // Initialize counter from the max existing barcode number
        Long maxId = barcodeRepository.findMaxId();
        counter = new AtomicLong(maxId != null ? maxId : 0);
    }

    /**
     * Generate a unique barcode value.
     */
    public String generateBarcodeValue() {
        long nextVal = counter.incrementAndGet();
        return BARCODE_PREFIX + String.format("%0" + BARCODE_NUMBER_LENGTH + "d", nextVal);
    }

    /**
     * Create a Barcode entity for a purchase item.
     */
    public Barcode createBarcode(PurchaseItems purchaseItem, String generatedBy) {
        Barcode barcode = new Barcode();
        barcode.setBarcodeValue(generateBarcodeValue());
        barcode.setTag(barcode.getBarcodeValue()); // tag mirrors barcodeValue by default
        barcode.setPurchaseItems(purchaseItem);
        barcode.setBarcodedatetime(LocalDateTime.now());
        barcode.setGeneratedBy(generatedBy);
        barcode.setStatus("ACTIVE");
        barcode.setPrintCount(0);
        return barcodeRepository.save(barcode);
    }

    public Barcode generateForPurchaseItem(PurchaseItems purchaseItem, String generatedBy) {
        return createBarcode(purchaseItem, generatedBy);
    }

    /**
     * Look up a barcode by its value string.
     */
    public Optional<Barcode> findByBarcodeValue(String barcodeValue) {
        return barcodeRepository.findByBarcodeValue(barcodeValue);
    }

    public Optional<Barcode> lookupBarcode(String barcodeValue) {
        return findByBarcodeValue(barcodeValue);
    }

    /**
     * Validate that a barcode exists and is active.
     */
    public boolean isValidAndActive(String barcodeValue) {
        Optional<Barcode> barcode = findByBarcodeValue(barcodeValue);
        return barcode.isPresent() && "ACTIVE".equals(barcode.get().getStatus());
    }

    /**
     * Increment the print count for a barcode.
     */
    public void incrementPrintCount(Long barcodeId) {
        barcodeRepository.findById(barcodeId).ifPresent(barcode -> {
            barcode.setPrintCount(barcode.getPrintCount() + 1);
            barcodeRepository.save(barcode);
        });
    }

    public void incrementPrintCount(String barcodeValue) {
        findByBarcodeValue(barcodeValue).ifPresent(barcode -> {
            barcode.setPrintCount(barcode.getPrintCount() + 1);
            barcodeRepository.save(barcode);
        });
    }

    /**
     * Void a barcode (e.g., if the item is returned or damaged).
     */
    public void voidBarcode(Long barcodeId) {
        barcodeRepository.findById(barcodeId).ifPresent(barcode -> {
            barcode.setStatus("VOIDED");
            barcodeRepository.save(barcode);
        });
    }

    public boolean voidBarcode(String barcodeValue) {
        Optional<Barcode> opt = findByBarcodeValue(barcodeValue);
        if (opt.isPresent()) {
            Barcode barcode = opt.get();
            barcode.setStatus("VOIDED");
            barcodeRepository.save(barcode);
            return true;
        }
        return false;
    }
}
