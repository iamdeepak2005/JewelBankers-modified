package com.jewelbankers.controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jewelbankers.aop.SwitchDatabase;
import com.jewelbankers.entity.InventoryMovement;
import com.jewelbankers.entity.PurchaseItems;
import com.jewelbankers.enums.ItemStatus;
import com.jewelbankers.enums.MetalType;
import com.jewelbankers.enums.MovementAction;
import com.jewelbankers.repository.PurchaseItemsRepository;
import com.jewelbankers.services.InventoryMovementService;

@RestController
@RequestMapping("/jewelbankersapi/inventory")
@CrossOrigin(origins = "*")
@SwitchDatabase
public class InventoryController {

    @Autowired
    private PurchaseItemsRepository purchaseItemsRepository;

    @Autowired
    private InventoryMovementService inventoryMovementService;

    /**
     * Get inventory items with multi-parameter filtering
     */
    @GetMapping("/items")
    public ResponseEntity<List<PurchaseItems>> getInventory(
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) MetalType metalType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        List<PurchaseItems> allItems = purchaseItemsRepository.findAll();
        List<PurchaseItems> filtered = new ArrayList<>();

        for (PurchaseItems item : allItems) {
            boolean match = true;

            if (status != null && item.getItemStatus() != status) {
                // Also check legacy status string if itemStatus is null
                if (item.getItemStatus() == null) {
                    if (!status.name().equalsIgnoreCase(item.getStatus())) {
                        match = false;
                    }
                } else {
                    match = false;
                }
            }

            if (match && metalType != null && item.getMetalType() != metalType) {
                match = false;
            }

            if (match && category != null && !category.isBlank()) {
                if (item.getCategory() == null || !item.getCategory().equalsIgnoreCase(category)) {
                    match = false;
                }
            }

            if (match && search != null && !search.isBlank()) {
                String q = search.toLowerCase();
                boolean matchesSearch = false;
                if (item.getDesignNo() != null && item.getDesignNo().toLowerCase().contains(q)) matchesSearch = true;
                if (item.getHuid() != null && item.getHuid().toLowerCase().contains(q)) matchesSearch = true;
                if (item.getBarcode() != null && item.getBarcode().getBarcodeValue() != null && item.getBarcode().getBarcodeValue().toLowerCase().contains(q)) matchesSearch = true;
                if (item.getItemName() != null && item.getItemName().toLowerCase().contains(q)) matchesSearch = true;
                if (item.getItem() != null && item.getItem().getName() != null && item.getItem().getName().toLowerCase().contains(q)) matchesSearch = true;
                if (!matchesSearch) {
                    match = false;
                }
            }

            if (match) {
                filtered.add(item);
            }
        }

        return ResponseEntity.ok(filtered);
    }

    /**
     * Get single inventory item by ID
     */
    @GetMapping("/items/{id}")
    public ResponseEntity<?> getItemById(@PathVariable Long id) {
        return purchaseItemsRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lookup item by barcode value
     */
    @GetMapping("/items/barcode/{barcodeValue}")
    public ResponseEntity<?> getItemByBarcode(@PathVariable String barcodeValue) {
        List<PurchaseItems> items = purchaseItemsRepository.findAll();
        for (PurchaseItems item : items) {
            if (item.getBarcode() != null && barcodeValue.equalsIgnoreCase(item.getBarcode().getBarcodeValue())) {
                return ResponseEntity.ok(item);
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Item not found for barcode: " + barcodeValue));
    }

    /**
     * Update item status (e.g. AVAILABLE -> DAMAGED / HOLD / MELTED)
     */
    @PutMapping("/items/{id}/status")
    public ResponseEntity<?> updateItemStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        Optional<PurchaseItems> opt = purchaseItemsRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseItems item = opt.get();
        ItemStatus oldStatus = item.getItemStatus() != null ? item.getItemStatus() : ItemStatus.AVAILABLE;
        ItemStatus newStatus = ItemStatus.valueOf(payload.get("status"));
        String reason = payload.getOrDefault("reason", "Status change via Inventory");
        String performedBy = payload.getOrDefault("performedBy", "USER");

        item.setItemStatus(newStatus);
        item.setStatus(newStatus.name());
        purchaseItemsRepository.save(item);

        inventoryMovementService.recordMovement(
                item.getId(),
                MovementAction.ADJUSTMENT,
                oldStatus,
                newStatus,
                "PurchaseItems",
                item.getId(),
                performedBy,
                "Manual adjustment: " + reason
        );

        return ResponseEntity.ok(item);
    }

    /**
     * Update item location (counter, tray, rack)
     */
    @PutMapping("/items/{id}/location")
    public ResponseEntity<?> updateItemLocation(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        Optional<PurchaseItems> opt = purchaseItemsRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        PurchaseItems item = opt.get();
        String oldLocation = item.getLocation();
        String rack = payload.get("rack");
        String tray = payload.get("tray");
        String counter = payload.get("counter");
        String newLocation = (counter != null ? counter + "-" : "") + (tray != null ? tray + "-" : "") + (rack != null ? rack : "");

        item.setRack(rack);
        item.setTray(tray);
        item.setCounter(counter);
        item.setLocation(newLocation);
        purchaseItemsRepository.save(item);

        inventoryMovementService.recordTransfer(item, oldLocation, newLocation, "Location update");

        return ResponseEntity.ok(item);
    }

    /**
     * Get movement history audit trail for an item
     */
    @GetMapping("/movements/{itemId}")
    public ResponseEntity<List<InventoryMovement>> getItemMovements(@PathVariable Long itemId) {
        return ResponseEntity.ok(inventoryMovementService.getMovementsForItem(itemId));
    }

    /**
     * Overall inventory summary metrics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getInventoryStats() {
        List<PurchaseItems> items = purchaseItemsRepository.findAll();

        long totalItems = items.size();
        long availableItems = 0;
        long soldItems = 0;
        long holdItems = 0;
        double totalGoldWeight = 0;
        double totalSilverWeight = 0;
        BigDecimal totalStockValue = BigDecimal.ZERO;

        Map<String, Long> categoryBreakdown = new HashMap<>();

        for (PurchaseItems pi : items) {
            ItemStatus s = pi.getItemStatus();
            if (s == null) {
                if ("SOLD".equalsIgnoreCase(pi.getStatus())) s = ItemStatus.SOLD;
                else s = ItemStatus.AVAILABLE;
            }

            if (s == ItemStatus.AVAILABLE) availableItems++;
            else if (s == ItemStatus.SOLD) soldItems++;
            else if (s == ItemStatus.HOLD || s == ItemStatus.RESERVED) holdItems++;

            if (s == ItemStatus.AVAILABLE) {
                double wt = pi.getGrossweight() != null ? pi.getGrossweight().doubleValue() : pi.getWeight();
                if (pi.getMetalType() == MetalType.SILVER) {
                    totalSilverWeight += wt;
                } else {
                    totalGoldWeight += wt;
                }

                if (pi.getTotalamount() != null) {
                    totalStockValue = totalStockValue.add(pi.getTotalamount());
                } else if (pi.getAmount() != null) {
                    totalStockValue = totalStockValue.add(pi.getAmount());
                }

                String cat = pi.getCategory() != null ? pi.getCategory() : "Uncategorized";
                categoryBreakdown.put(cat, categoryBreakdown.getOrDefault(cat, 0L) + 1);
            }
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalItems", totalItems);
        stats.put("availableItems", availableItems);
        stats.put("soldItems", soldItems);
        stats.put("holdItems", holdItems);
        stats.put("totalGoldWeightGrams", Math.round(totalGoldWeight * 1000.0) / 1000.0);
        stats.put("totalSilverWeightGrams", Math.round(totalSilverWeight * 1000.0) / 1000.0);
        stats.put("totalStockValue", totalStockValue);
        stats.put("categoryBreakdown", categoryBreakdown);

        return ResponseEntity.ok(stats);
    }
}
