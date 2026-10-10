package com.jewelbankers.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.jewelbankers.entity.Sales;
import com.jewelbankers.entity.SalesItems;
import com.jewelbankers.repository.SalesRepository;

import jakarta.transaction.Transactional;

@Service
public class SalesService {

    @Autowired
    private SalesRepository salesRepository;

    @Autowired(required = false)
    private com.jewelbankers.repository.PurchaseItemsRepository purchaseItemsRepository;

    @Autowired(required = false)
    private InventoryMovementService inventoryMovementService;

    @Autowired(required = false)
    private com.jewelbankers.repository.CustomerRepository customerRepository;

    @Autowired(required = false)
    private WhatsAppService whatsAppService;

    @Transactional
    public Sales saveSales(Sales sales) {
        if (sales.getStatus() == null) {
            sales.setStatus(com.jewelbankers.enums.SaleStatus.COMPLETED);
        }

        if (sales.getBilldate() == null) {
            sales.setBilldate(LocalDateTime.now());
        }

        // Attach existing customer if present
        if (sales.getCustomer() != null && customerRepository != null) {
            Long custId = sales.getCustomer().getCustomerid();
            if (custId != null) {
                com.jewelbankers.entity.Customer existing = customerRepository.findById(custId).orElse(null);
                sales.setCustomer(existing);
            } else if (sales.getCustomer().getCustomerName() != null && !sales.getCustomer().getCustomerName().trim().isEmpty()) {
                try {
                    com.jewelbankers.entity.Customer savedCust = customerRepository.save(sales.getCustomer());
                    sales.setCustomer(savedCust);
                } catch (Exception ignored) {}
            }
        }

        // Link items to sale and clean up IDs that default to 0
        if (sales.getSalesItems() != null) {
            for (SalesItems item : sales.getSalesItems()) {
                item.setSales(sales);
                if (item.getItemid() != null && item.getItemid() <= 0) {
                    item.setItemid(null);
                }
                if (item.getPurchaseid() != null && item.getPurchaseid() <= 0) {
                    item.setPurchaseid(null);
                }
                if (item.getPurchaseitemid() != null && item.getPurchaseitemid() <= 0) {
                    item.setPurchaseitemid(null);
                }
            }
        }

        // Save sales first
        Sales savedSales = salesRepository.save(sales);

        if (savedSales.getBillno() == null) {
            savedSales.setBillno(savedSales.getId());
        }
        if (savedSales.getInvoiceNumber() == null) {
            savedSales.setInvoiceNumber("INV-" + java.time.Year.now().getValue() + "-" + String.format("%05d", savedSales.getBillno()));
        }

        savedSales = salesRepository.save(savedSales);
        final Sales finalSales = savedSales;

        // Deduct inventory items and track movement
        if (finalSales.getSalesItems() != null && purchaseItemsRepository != null) {
            for (SalesItems item : finalSales.getSalesItems()) {
                if (item.getPurchaseitemid() != null && item.getPurchaseitemid() > 0) {
                    purchaseItemsRepository.findById(item.getPurchaseitemid()).ifPresent(pItem -> {
                        pItem.setItemStatus(com.jewelbankers.enums.ItemStatus.SOLD);
                        pItem.setStatus("SOLD");
                        purchaseItemsRepository.save(pItem);

                        if (inventoryMovementService != null) {
                            inventoryMovementService.recordMovement(
                                pItem.getId(),
                                com.jewelbankers.enums.MovementAction.SALE,
                                com.jewelbankers.enums.ItemStatus.AVAILABLE,
                                com.jewelbankers.enums.ItemStatus.SOLD,
                                "Sales",
                                finalSales.getId(),
                                "SYSTEM",
                                "Sale #" + finalSales.getInvoiceNumber()
                            );
                        }
                    });
                }
            }
        }

        // Automated WhatsApp Notification to Customer for Jewellery Purchase
        if (whatsAppService != null) {
            try {
                whatsAppService.sendJewellerySaleConfirmationAsync(finalSales);
            } catch (Exception ex) {
                System.err.println("Non-blocking error triggering jewellery sale WhatsApp notification: " + ex.getMessage());
            }
        }

        return savedSales;
    }


    public Sales getSalesById(Long id) {
        Optional<Sales> sales = salesRepository.findById(id);
        return sales.orElse(null);
    }

    public void deleteSales(Long id) {
        salesRepository.deleteById(id);
    }

    public List<Sales> getAllSales() {
        return salesRepository.findAll();
    }
    
    public Sales calculateMakingWastageCharges(Long salesId) {
        // Fetch sales data
        Sales sales = salesRepository.findById(salesId)
                .orElseThrow(() -> new RuntimeException("Sales not found for ID: " + salesId));

        // Initialize total amount
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Iterate over SalesItems to calculate charges
        for (SalesItems item : sales.getSalesItems()) {
            // Convert primitive values to BigDecimal
            BigDecimal weight = BigDecimal.valueOf(item.getGrosswt());
            BigDecimal rate = BigDecimal.valueOf(item.getRate());
            BigDecimal makingPercent = BigDecimal.valueOf(item.getMakingpercent());
            BigDecimal wastagePercent = BigDecimal.valueOf(item.getWastagepercent());

            // Calculate values
            BigDecimal amount = weight.multiply(rate);
            BigDecimal wastageCharges = weight.multiply(wastagePercent).multiply(rate).divide(BigDecimal.valueOf(100));
            BigDecimal makingCharges = weight.multiply(makingPercent).multiply(rate).divide(BigDecimal.valueOf(100));
            BigDecimal itemTotalAmount = amount.add(wastageCharges).add(makingCharges);

            // Set calculated values back to the entity
//            item.setAmount(amount);
//            item.setWastagecharge(wastageCharges.doubleValue());
//            item.setMakingcharge(makingCharges.doubleValue());
//
//            // Accumulate total amount
//            totalAmount = totalAmount.add(itemTotalAmount);
        }

        // Set total amount in Sales entity
        sales.setTotalamount(totalAmount.doubleValue());

        // Save updated sales entity
        return salesRepository.save(sales);
    }

    public List<Sales> searchSales(Map<String, String> searchParams) {
        Specification<Sales> spec = (root, query, builder) -> {
            if (searchParams != null && !searchParams.isEmpty()) {
                List<Specification<Sales>> specs = searchParams.entrySet().stream()
                        .map(entry -> {
                            String key = entry.getKey();
                            String value = entry.getValue();
                            
                            // Create specifications based on different search parameters
                            if ("billno".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("billno"), Long.parseLong(value));
                            } else if ("billprefix".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.like(root1.get("billprefix"), "%" + value + "%");
                            } else if ("billdate".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("billdate"), LocalDateTime.parse(value));
                            } else if ("paymenttype".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("paymenttype"), value);
                            } else if ("salesman".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.like(root1.get("salesman"), "%" + value + "%");
                            } else if ("billduedatetime".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("billduedatetime"), LocalDateTime.parse(value));
                            } else if ("billamount".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("billamount"), new BigDecimal(value));
                            } else if ("gstamount".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("gstamount"), Double.parseDouble(value));
                            } else if ("billdiscount".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("billdiscount"), Double.parseDouble(value));
                            } else if ("totalamount".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("totalamount"), Double.parseDouble(value));
                            } else if ("paymentsubtype".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("paymentsubtype"), value);
                            } else if ("paymentrefno".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("paymentrefno"), value);
                            } else if ("paytmentrecieved".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("paytmentrecieved"), new BigDecimal(value));
                            } else if ("paymentbalanceamt".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("paymentbalanceamt"), new BigDecimal(value));
                            } else if ("paymentseqno".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("paymentseqno"), Long.parseLong(value));
                            } else if ("customer.id".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("customer").get("id"), Long.parseLong(value));
                            } else if ("salesitems.id".equals(key)) {
                                return (Specification<Sales>) (root1, query1, builder1) -> builder1.equal(root1.get("salesitems").get("id"), Long.parseLong(value));
                            } else {
                                return null;
                            }
                        })
                        .filter(specification -> specification != null)
                        .collect(Collectors.toList());

                // Combine all specifications using AND if they exist
                if (!specs.isEmpty()) {
                    Specification<Sales> resultSpec = specs.get(0);
                    for (int i = 1; i < specs.size(); i++) {
                        resultSpec = Specification.where(resultSpec).and(specs.get(i));
                    }
                    return resultSpec.toPredicate(root, query, builder);
                }
            }
            return builder.conjunction(); // Return all records if no filters are applied
        };

        return salesRepository.findAll(spec);
    }

}
