package com.jewelbankers.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.jewelbankers.entity.Purchase;
import com.jewelbankers.entity.PurchaseItems;
import com.jewelbankers.entity.Supplier;
import com.jewelbankers.repository.PurchaseItemsRepository;
import com.jewelbankers.repository.PurchaseRepository;
import com.jewelbankers.repository.SupplierRepository;

import jakarta.transaction.Transactional;

@Service
public class PurchaseService {

    @Autowired
    private PurchaseRepository purchaseRepository;
    
    
    @Autowired
    private PurchaseItemsRepository purchaseItemsRepository;
    private final SupplierRepository supplierRepository;

    public PurchaseService(PurchaseRepository purchaseRepository, SupplierRepository supplierRepository) {
        this.purchaseRepository = purchaseRepository;
        this.supplierRepository = supplierRepository;
    }

	/*
	 * @Transactional public Purchase savePurchase(Purchase purchase) { if
	 * (purchase.getSupplier() != null && purchase.getSupplier().getId() != null) {
	 * Supplier existingSupplier =
	 * supplierRepository.findById(purchase.getSupplier().getId()).orElse(null); if
	 * (existingSupplier != null) { purchase.setSupplier(existingSupplier); //
	 * Attach existing supplier } }
	 * 
	 * // First save to generate the ID Purchase savedPurchase =
	 * purchaseRepository.save(purchase);
	 * 
	 * // Set invoice number based on the generated ID if
	 * (savedPurchase.getInvoiceno() == null) {
	 * savedPurchase.setInvoiceno(savedPurchase.getId()); return
	 * purchaseRepository.save(savedPurchase); // Save again with the updated
	 * invoice number }
	 * 
	 * return savedPurchase; }
	 */

    @Transactional
    public Purchase savePurchase(Purchase purchase) {
        if (purchase.getSupplier() != null && purchase.getSupplier().getId() != null) {
            Supplier existingSupplier = supplierRepository.findById(purchase.getSupplier().getId()).orElse(null);
            purchase.setSupplier(existingSupplier);
        } else {
            purchase.setSupplier(null);
        }

        List<PurchaseItems> inputItems = purchase.getPurchaseItems();
        // Clear items on purchase before saving to prevent uncascaded transient exceptions
        purchase.setPurchaseItems(new ArrayList<>());

        // Save purchase first to generate the ID
        Purchase savedPurchase = purchaseRepository.save(purchase);

        // Set invoice number based on the generated ID
        if (savedPurchase.getInvoiceno() == null) {
            savedPurchase.setInvoiceno(savedPurchase.getId());
            savedPurchase = purchaseRepository.save(savedPurchase);
        }

        // Generate and save purchase items
        List<PurchaseItems> purchaseItemsList = generatePurchaseItems(savedPurchase, inputItems);
        if (!purchaseItemsList.isEmpty()) {
            Iterable<PurchaseItems> savedItemsIterable = purchaseItemsRepository.saveAll(purchaseItemsList);
            List<PurchaseItems> savedItems = new ArrayList<>();
            savedItemsIterable.forEach(savedItems::add);

            // Now items are persisted with IDs, generate unique barcodes
            if (barcodeGenerationService != null) {
                for (PurchaseItems item : savedItems) {
                    if (item.getBarcode() == null) {
                        try {
                            com.jewelbankers.entity.Barcode generatedBarcode = barcodeGenerationService.generateForPurchaseItem(item, "SYSTEM");
                            item.setBarcode(generatedBarcode);
                        } catch (Exception ignored) {
                        }
                    }
                }
                Iterable<PurchaseItems> updatedItems = purchaseItemsRepository.saveAll(savedItems);
                savedItems = new ArrayList<>();
                updatedItems.forEach(savedItems::add);
            }
            savedPurchase.setPurchaseItems(savedItems);
        }

        return savedPurchase;
    }

    @Autowired(required = false)
    private BarcodeGenerationService barcodeGenerationService;

    @Autowired(required = false)
    private InventoryMovementService inventoryMovementService;

    /**
     * Generates purchase items based on quantity.
     */
    private List<PurchaseItems> generatePurchaseItems(Purchase savedPurchase, List<PurchaseItems> purchaseItems) {
        List<PurchaseItems> purchaseItemsList = new ArrayList<>();
        if (purchaseItems == null) {
            return purchaseItemsList;
        }
        
        for (PurchaseItems item : purchaseItems) {
            int quantity = (item.getQuantity() != null && item.getQuantity() > 0) ? item.getQuantity() : 1;
            
            // Clean up itemid to avoid foreign key errors on null/zero
            if (item.getItemid() != null && item.getItemid() <= 0) {
                item.setItemid(null);
            }

            if (quantity == 1) {
                item.setPurchase(savedPurchase);
                if (item.getItemStatus() == null) {
                    item.setItemStatus(com.jewelbankers.enums.ItemStatus.AVAILABLE);
                }
                if (item.getStatus() == null) {
                    item.setStatus("AVAILABLE");
                }
                purchaseItemsList.add(item);
            } else {
                // Split multi-quantity purchase into individual inventory units
                BigDecimal qtyBD = BigDecimal.valueOf(quantity);
                for (int i = 0; i < quantity; i++) {
                    PurchaseItems newItem = new PurchaseItems();
                    newItem.setPurchase(savedPurchase);
                    newItem.setItemid(item.getItemid());
                    newItem.setItem(item.getItem());
                    newItem.setItemName(item.getItemName());
                    newItem.setCategory(item.getCategory());
                    newItem.setMetalType(item.getMetalType());
                    newItem.setDesignNo(item.getDesignNo());
                    newItem.setHuid(item.getHuid());
                    newItem.setPurity(item.getPurity());
                    newItem.setWastagepercent(item.getWastagepercent());
                    newItem.setQuantity(1);
                    newItem.setLocation(item.getLocation());
                    newItem.setCounter(item.getCounter());
                    newItem.setTray(item.getTray());
                    newItem.setRack(item.getRack());
                    newItem.setMakingCharge(item.getMakingCharge());
                    newItem.setMakingChargeType(item.getMakingChargeType());
                    
                    if (item.getWeight() > 0) {
                        newItem.setWeight(item.getWeight() / quantity);
                    }
                    if (item.getNetWeight() != null) {
                        newItem.setNetWeight(item.getNetWeight().divide(qtyBD, 4, RoundingMode.HALF_UP));
                    }
                    if (item.getGrossweight() != null) {
                        newItem.setGrossweight(item.getGrossweight().divide(qtyBD, 4, RoundingMode.HALF_UP));
                    }
                    if (item.getStoneweight() != null) {
                        newItem.setStoneweight(item.getStoneweight().divide(qtyBD, 4, RoundingMode.HALF_UP));
                    }
                    if (item.getRate() != null) {
                        newItem.setRate(item.getRate());
                    }
                    if (item.getAmount() != null) {
                        newItem.setAmount(item.getAmount().divide(qtyBD, 2, RoundingMode.HALF_UP));
                    }
                    if (item.getTotalamount() != null) {
                        newItem.setTotalamount(item.getTotalamount().divide(qtyBD, 2, RoundingMode.HALF_UP));
                    }
                    newItem.setItemStatus(com.jewelbankers.enums.ItemStatus.AVAILABLE);
                    newItem.setStatus("AVAILABLE");
                    purchaseItemsList.add(newItem);
                }
            }
        }
        return purchaseItemsList;
    }
    


    // Get Purchase by ID
    public Purchase getPurchaseById(Long id) {
        return purchaseRepository.findById(id).orElse(null);
    }

    // Get all Purchases
    public Iterable<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    // Delete Purchase by ID
    public void deletePurchase(Long id) {
        purchaseRepository.deleteById(id);
    }
    
    public List<Purchase> searchPurchases(Map<String, String> searchParams) {
        Specification<Purchase> spec = (root, query, builder) -> {
            if (searchParams != null && !searchParams.isEmpty()) {
                List<Specification<Purchase>> specs = searchParams.entrySet().stream()
                        .map(entry -> {
                            String key = entry.getKey();
                            String value = entry.getValue();
                            
                            // Create specifications based on different search parameters
                            if ("invoiceno".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("invoiceno"), Long.parseLong(value));
                            } else if ("invoiceprefix".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.like(root1.get("invoiceprefix"), "%" + value + "%");
                            } else if ("invoicedatetime".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("invoicedatetime"), LocalDateTime.parse(value));
                            } else if ("paymenttype".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("paymenttype"), value);
                            } else if ("comments".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.like(root1.get("comments"), "%" + value + "%");
                            } else if ("totalamount".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("totalamount"), new BigDecimal(value));
                            } else if ("status".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("status"), value);
                            } else if ("gstamount".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("gstamount"), new BigDecimal(value));
                            } else if ("discount".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("discount"), Double.parseDouble(value));
                            } else if ("supplier.id".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("supplier").get("id"), Long.parseLong(value));
                            } else if ("purchaseItems.id".equals(key)) {
                                return (Specification<Purchase>) (root1, query1, builder1) -> builder1.equal(root1.get("purchaseItems").get("id"), Long.parseLong(value));
                            } else {
                                return null;
                            }
                        })
                        .filter(specification -> specification != null)
                        .collect(Collectors.toList());

                // Combine all specifications using AND if they exist
                if (!specs.isEmpty()) {
                    Specification<Purchase> resultSpec = specs.get(0);
                    for (int i = 1; i < specs.size(); i++) {
                        resultSpec = Specification.where(resultSpec).and(specs.get(i));
                    }
                    return resultSpec.toPredicate(root, query, builder);
                }
            }
            return builder.conjunction(); // Return all records if no filters are applied
        };

        return purchaseRepository.findAll(spec);
    }


}
