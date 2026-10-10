package com.jewelbankers.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jewelbankers.entity.Estimate;
import com.jewelbankers.entity.Purchase;
import com.jewelbankers.entity.PurchaseItems;
import com.jewelbankers.entity.Sales;
import com.jewelbankers.enums.EstimateStatus;
import com.jewelbankers.enums.ItemStatus;
import com.jewelbankers.enums.MetalType;
import com.jewelbankers.repository.EstimateRepository;
import com.jewelbankers.repository.OldGoldRepository;
import com.jewelbankers.repository.PurchaseItemsRepository;
import com.jewelbankers.repository.PurchaseRepository;
import com.jewelbankers.repository.SalesRepository;

@RestController
@RequestMapping("/jewelbankersapi/jewellery/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class JewelleryDashboardController {

    @Autowired
    private PurchaseItemsRepository purchaseItemsRepository;

    @Autowired
    private SalesRepository salesRepository;

    @Autowired
    private PurchaseRepository purchaseRepository;

    @Autowired
    private EstimateRepository estimateRepository;

    @Autowired
    private OldGoldRepository oldGoldRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        Map<String, Object> dashboard = new HashMap<>();

        // 1. Inventory Summary
        List<PurchaseItems> allItems = purchaseItemsRepository.findAll();
        long totalStockCount = 0;
        double totalGoldWeight = 0;
        double totalSilverWeight = 0;
        BigDecimal totalStockValue = BigDecimal.ZERO;

        for (PurchaseItems pi : allItems) {
            ItemStatus status = pi.getItemStatus();
            if (status == null && !"SOLD".equalsIgnoreCase(pi.getStatus())) {
                status = ItemStatus.AVAILABLE;
            }
            if (status == ItemStatus.AVAILABLE) {
                totalStockCount++;
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
            }
        }

        dashboard.put("totalStockCount", totalStockCount);
        dashboard.put("totalGoldWeightGrams", Math.round(totalGoldWeight * 1000.0) / 1000.0);
        dashboard.put("totalSilverWeightGrams", Math.round(totalSilverWeight * 1000.0) / 1000.0);
        dashboard.put("totalStockValue", totalStockValue);

        // 2. Sales Summary (Today & All)
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);

        List<Sales> allSales = salesRepository.findAll();
        long todaySalesCount = 0;
        double todaySalesAmount = 0;
        double totalSalesAmount = 0;

        List<Map<String, Object>> recentSalesList = new ArrayList<>();

        for (Sales s : allSales) {
            totalSalesAmount += s.getTotalamount();
            if (s.getBilldate() != null && !s.getBilldate().isBefore(startOfToday) && !s.getBilldate().isAfter(endOfToday)) {
                todaySalesCount++;
                todaySalesAmount += s.getTotalamount();
            }
        }

        // Recent 5 sales
        int salesSize = allSales.size();
        int salesStart = Math.max(0, salesSize - 5);
        for (int i = salesSize - 1; i >= salesStart; i--) {
            Sales s = allSales.get(i);
            Map<String, Object> saleInfo = new HashMap<>();
            saleInfo.put("id", s.getId());
            saleInfo.put("invoiceNumber", s.getInvoiceNumber() != null ? s.getInvoiceNumber() : ("INV-" + s.getBillno()));
            saleInfo.put("customerName", s.getCustomer() != null ? s.getCustomer().getCustomerName() : "Walk-in Customer");
            saleInfo.put("totalAmount", s.getTotalamount());
            saleInfo.put("billDate", s.getBilldate());
            saleInfo.put("status", s.getStatus() != null ? s.getStatus().name() : "COMPLETED");
            recentSalesList.add(saleInfo);
        }

        dashboard.put("todaySalesCount", todaySalesCount);
        dashboard.put("todaySalesAmount", todaySalesAmount);
        dashboard.put("totalSalesCount", allSales.size());
        dashboard.put("totalSalesAmount", totalSalesAmount);
        dashboard.put("recentSales", recentSalesList);

        // 3. Estimates Summary
        List<Estimate> activeEstimates = estimateRepository.findByStatus(EstimateStatus.ACTIVE);
        dashboard.put("activeEstimatesCount", activeEstimates.size());

        // 4. Old Gold Trade-ins
        long oldGoldCount = oldGoldRepository.count();
        dashboard.put("oldGoldExchangesCount", oldGoldCount);

        // 5. Purchases count
        dashboard.put("totalPurchasesCount", purchaseRepository.count());

        return ResponseEntity.ok(dashboard);
    }
}
