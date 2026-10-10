package com.jewelbankers.services.ai;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.apache.commons.text.similarity.LevenshteinDistance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.jewelbankers.dto.*;
import com.jewelbankers.entity.*;
import com.jewelbankers.repository.*;
import com.jewelbankers.services.*;

/**
 * Executes AI tool calls by routing them to the appropriate Spring Boot services.
 * This is the bridge between Gemini's function calls and the actual business logic.
 * 
 * EVERY AI action goes through here → existing service → database.
 * The AI NEVER directly manipulates the database.
 */
@Service
public class AiToolExecutor {

    private static final Logger logger = LoggerFactory.getLogger(AiToolExecutor.class);

    @Value("${ai.confirmation.required:REDEEM_PLEDGE,CANCEL_PLEDGE,CREATE_SALE,DELETE_ITEM,UPDATE_CUSTOMER}")
    private String confirmationRequiredActions;

    @Autowired private CustomerService customerService;
    @Autowired private BillService billService;
    @Autowired private BillRepository billRepository;
    @Autowired private BarcodeGenerationService barcodeGenerationService;
    @Autowired private EstimateService estimateService;
    @Autowired private SalesService salesService;
    @Autowired private PurchaseItemsService purchaseItemsService;
    @Autowired private SettingsService settingsService;
    @Autowired private SettingsRepository settingsRepository;

    // Cache for pending confirmations (in production, use Redis or similar)
    private final Map<String, AiConfirmation> pendingConfirmations = new LinkedHashMap<String, AiConfirmation>() {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, AiConfirmation> eldest) {
            return size() > 100; // Keep max 100 pending confirmations
        }
    };

    /**
     * Execute a tool call and return the result.
     * This is the main dispatch method.
     */
    public AiToolResult executeTool(String toolName, Map<String, Object> args) {
        logger.info("Executing AI tool: {} with args: {}", toolName, args);

        try {
            return switch (toolName) {
                case "searchCustomers" -> executeSearchCustomers(args);
                case "getCustomerHistory" -> executeGetCustomerHistory(args);
                case "searchPledges" -> executeSearchPledges(args);
                case "calculateRedemption" -> executeCalculateRedemption(args);
                case "redeemPledge" -> executeRedeemPledge(args);
                case "searchInventory" -> executeSearchInventory(args);
                case "lookupBarcode" -> executeLookupBarcode(args);
                case "generateBarcode" -> executeGenerateBarcode(args);
                case "createEstimate" -> executeCreateEstimate(args);
                case "createSale" -> executeCreateSale(args);
                case "getGoldRate" -> executeGetGoldRate(args);
                case "getSilverRate" -> executeGetSilverRate(args);
                case "getDashboardSummary" -> executeGetDashboardSummary(args);
                case "analyzeJewelleryImage" -> executeAnalyzeImage(args);
                case "openStockInward" -> executeOpenStockInward(args);
                case "openNewPledge" -> executeOpenNewPledge(args);
                case "navigateTo" -> executeNavigateTo(args);
                default -> AiToolResult.error(toolName, "Unknown tool: " + toolName);
            };
        } catch (Exception e) {
            logger.error("Error executing tool: {}", toolName, e);
            return AiToolResult.error(toolName, "Error executing " + toolName + ": " + e.getMessage());
        }
    }

    /**
     * Execute a confirmed action (after user approved).
     */
    public AiToolResult executeConfirmedAction(String confirmationId) {
        AiConfirmation confirmation = pendingConfirmations.remove(confirmationId);
        if (confirmation == null) {
            return AiToolResult.error("confirmation", "Confirmation expired or not found. Please try again.");
        }

        logger.info("Executing confirmed action: {}", confirmation.getAction());
        
        return switch (confirmation.getAction()) {
            case "REDEEM_PLEDGE" -> executeRedeemPledgeConfirmed(confirmation.getParameters());
            case "CREATE_SALE" -> executeCreateSaleConfirmed(confirmation.getParameters());
            default -> AiToolResult.error(confirmation.getAction(), "Unknown confirmation action");
        };
    }

    // ==================== TOOL IMPLEMENTATIONS ====================

    private AiToolResult executeSearchCustomers(Map<String, Object> args) {
        String query = (String) args.getOrDefault("query", "");
        
        // Use existing customer search
        List<Customer> customers;
        if (query.matches("\\d{7,15}")) {
            try {
                Long phone = Long.parseLong(query);
                customers = customerService.findByPhoneNo(phone);
            } catch (NumberFormatException e) {
                customers = customerService.findCustomersByName(query);
            }
        } else {
            customers = customerService.findCustomersByName(query);
        }

        // Build fuzzy search results with similarity scoring
        List<CustomerSearchResult> results = new ArrayList<>();
        LevenshteinDistance ld = new LevenshteinDistance();
        
        for (Customer c : customers) {
            CustomerSearchResult result = new CustomerSearchResult();
            result.setCustomerid(c.getCustomerid());
            result.setCustomerName(c.getCustomerName());
            result.setAddress(c.getAddress());
            result.setArea(c.getArea());
            result.setStreet(c.getStreet());
            result.setDistrict(c.getDistrict());
            result.setState(c.getState());
            result.setPhoneno(c.getPhoneno());
            result.setMobileno(c.getMobileno());
            result.setPincode(c.getPincode());

            // Calculate similarity score
            double similarity = calculateSimilarity(query, c.getCustomerName());
            result.setSimilarityScore(similarity);
            result.setMatchCategory(categorizeSimilarity(similarity));

            // Get pledge counts
            try {
                List<Bill> openPledges = billRepository.findAll().stream()
                    .filter(b -> b.getCustomer() != null && 
                            b.getCustomer().getCustomerid().equals(c.getCustomerid()) &&
                            b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'O')
                    .collect(Collectors.toList());
                result.setOpenPledgeCount(openPledges.size());
                
                List<Bill> redeemedPledges = billRepository.findAll().stream()
                    .filter(b -> b.getCustomer() != null && 
                            b.getCustomer().getCustomerid().equals(c.getCustomerid()) &&
                            b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'C')
                    .collect(Collectors.toList());
                result.setRedeemedPledgeCount(redeemedPledges.size());
                result.setTotalPledgeCount(openPledges.size() + redeemedPledges.size());
            } catch (Exception e) {
                // Skip count if error
                logger.debug("Could not get pledge counts for customer {}", c.getCustomerid());
            }

            results.add(result);
        }

        // Sort by similarity score descending
        results.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));

        String summary = results.isEmpty() 
            ? "No customers found matching '" + query + "'."
            : "Found " + results.size() + " customer(s) matching '" + query + "'.";

        return AiToolResult.success("searchCustomers", "customer_card", results, summary);
    }

    private AiToolResult executeGetCustomerHistory(Map<String, Object> args) {
        Long customerId = toLong(args.get("customerId"));
        Optional<Customer> customerOpt = customerService.findById(customerId);
        
        if (customerOpt.isEmpty()) {
            return AiToolResult.error("getCustomerHistory", "Customer not found with ID: " + customerId);
        }

        Customer customer = customerOpt.get();
        
        // Get all bills for this customer
        List<Bill> allBills = billService.findBillsBySearch(customer.getCustomerName());
        
        Map<String, Object> history = new LinkedHashMap<>();
        history.put("customer", Map.of(
            "id", customer.getCustomerid(),
            "name", customer.getCustomerName(),
            "address", customer.getAddress() != null ? customer.getAddress() : "",
            "phone", customer.getPhoneno() != null ? customer.getPhoneno() : 0
        ));

        long openCount = allBills.stream().filter(b -> b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'O').count();
        long redeemedCount = allBills.stream().filter(b -> b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'C').count();
        
        history.put("openPledges", openCount);
        history.put("redeemedPledges", redeemedCount);
        history.put("totalPledges", allBills.size());
        
        // Recent pledges (last 10)
        List<Map<String, Object>> recentPledges = allBills.stream()
            .sorted((a, b) -> {
                if (a.getBillDate() == null || b.getBillDate() == null) return 0;
                return b.getBillDate().compareTo(a.getBillDate());
            })
            .limit(10)
            .map(this::billToMap)
            .collect(Collectors.toList());
        
        history.put("recentPledges", recentPledges);

        String summary = String.format("Customer %s has %d open pledge(s) and %d redeemed pledge(s).",
            customer.getCustomerName(), openCount, redeemedCount);

        return AiToolResult.success("getCustomerHistory", "customer_history", history, summary);
    }

    private AiToolResult executeSearchPledges(Map<String, Object> args) {
        String customerName = (String) args.getOrDefault("customerName", null);
        String statusStr = (String) args.getOrDefault("status", null);
        String startDateStr = (String) args.getOrDefault("startDate", null);
        String endDateStr = (String) args.getOrDefault("endDate", null);
        String article = (String) args.getOrDefault("article", null);
        String billNumber = (String) args.getOrDefault("billNumber", null);
        Integer amount = args.containsKey("amount") ? toInt(args.get("amount")) : null;

        Character status = null;
        if (statusStr != null && !statusStr.isEmpty()) {
            status = statusStr.toUpperCase().charAt(0);
        }

        LocalDate startDate = null, endDate = null;
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        try {
            if (startDateStr != null) startDate = LocalDate.parse(startDateStr, formatter);
            if (endDateStr != null) endDate = LocalDate.parse(endDateStr, formatter);
        } catch (Exception e) {
            logger.debug("Could not parse dates: {} - {}", startDateStr, endDateStr);
        }

        List<Bill> bills;
        
        // Use the existing BillService search with multiple parameters
        if (billNumber != null && !billNumber.isEmpty()) {
            bills = billService.findBillsBySearch(billNumber);
        } else {
            String search = customerName;
            Integer productTypeNo = null;
            bills = billService.findBillsBySearch(search, startDate, endDate, amount, status, productTypeNo, "desc", null);
        }

        // Additional filtering for article if provided
        if (article != null && !article.isEmpty()) {
            String articleLower = article.toLowerCase();
            bills = bills.stream()
                .filter(b -> b.getProductDescriptions() != null && 
                        b.getProductDescriptions().toLowerCase().contains(articleLower))
                .collect(Collectors.toList());
        }

        // Convert to display format
        List<Map<String, Object>> pledgeData = bills.stream()
            .limit(20) // Limit results
            .map(this::billToMap)
            .collect(Collectors.toList());

        String statusLabel = status != null ? (status == 'O' ? "open" : "redeemed/closed") : "all";
        String summary = pledgeData.isEmpty()
            ? "No " + statusLabel + " pledges found" + (customerName != null ? " for '" + customerName + "'" : "") + "."
            : "Found " + pledgeData.size() + " " + statusLabel + " pledge(s)" + (customerName != null ? " for '" + customerName + "'" : "") + ".";

        return AiToolResult.success("searchPledges", "pledge_card", pledgeData, summary);
    }

    private AiToolResult executeCalculateRedemption(Map<String, Object> args) {
        Integer billSequence = toInt(args.get("billSequence"));
        Optional<Bill> billOpt = billRepository.findById(Long.valueOf(billSequence));
        
        if (billOpt.isEmpty()) {
            return AiToolResult.error("calculateRedemption", "Pledge not found with bill sequence: " + billSequence);
        }

        Bill bill = billOpt.get();
        
        // Use existing service to calculate interest
        Map<String, Object> calculation = new LinkedHashMap<>();
        calculation.put("billSequence", bill.getBillSequence());
        calculation.put("billSerial", bill.getBillSerial());
        calculation.put("billNo", bill.getBillNo());
        calculation.put("customerName", bill.getCustomer() != null ? bill.getCustomer().getCustomerName() : "");
        calculation.put("billDate", bill.getBillDate() != null ? bill.getBillDate().toString() : "");
        calculation.put("amount", bill.getAmount());
        calculation.put("rateOfInterest", bill.getRateOfInterest());
        calculation.put("status", bill.getRedemptionStatus() != null ? (bill.getRedemptionStatus() == 'O' ? "OPEN" : "REDEEMED") : "UNKNOWN");
        
        // Interest calculation
        if (bill.getInterest() != null) {
            calculation.put("interest", bill.getInterest());
        }
        if (bill.getTotal() != null) {
            calculation.put("total", bill.getTotal());
        }
        calculation.put("articles", bill.getProductDescriptions());

        String summary = String.format("Pledge %s%d — Amount: ₹%d, Status: %s",
            bill.getBillSerial(), bill.getBillNo(), bill.getAmount(),
            bill.getRedemptionStatus() != null && bill.getRedemptionStatus() == 'O' ? "OPEN" : "REDEEMED");

        return AiToolResult.success("calculateRedemption", "pledge_card", calculation, summary);
    }

    private AiToolResult executeRedeemPledge(Map<String, Object> args) {
        Integer billSequence = toInt(args.get("billSequence"));
        Optional<Bill> billOpt = billRepository.findById(Long.valueOf(billSequence));
        
        if (billOpt.isEmpty()) {
            return AiToolResult.error("redeemPledge", "Pledge not found with bill sequence: " + billSequence);
        }

        Bill bill = billOpt.get();
        
        if (bill.getRedemptionStatus() != null && bill.getRedemptionStatus() == 'C') {
            return AiToolResult.error("redeemPledge", "This pledge is already redeemed.");
        }

        // Create confirmation — don't execute yet
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("billSequence", bill.getBillSequence());
        details.put("billSerial", bill.getBillSerial());
        details.put("billNo", bill.getBillNo());
        details.put("customerName", bill.getCustomer() != null ? bill.getCustomer().getCustomerName() : "");
        details.put("amount", bill.getAmount());
        details.put("articles", bill.getProductDescriptions());

        AiConfirmation confirmation = new AiConfirmation(
            "REDEEM_PLEDGE",
            String.format("Redeem pledge %s%d for customer %s. Amount: ₹%d",
                bill.getBillSerial(), bill.getBillNo(),
                bill.getCustomer() != null ? bill.getCustomer().getCustomerName() : "Unknown",
                bill.getAmount()),
            details,
            Map.of("billSequence", billSequence)
        );

        pendingConfirmations.put(confirmation.getConfirmationId(), confirmation);

        AiToolResult result = new AiToolResult();
        result.setToolName("redeemPledge");
        result.setStatus("pending_confirmation");
        result.setDisplayType("confirmation");
        result.setData(confirmation);
        result.setSummary("Pledge redemption requires your confirmation.");
        return result;
    }

    private AiToolResult executeRedeemPledgeConfirmed(Map<String, Object> params) {
        Integer billSequence = toInt(params.get("billSequence"));
        try {
            Optional<Bill> billOpt = billRepository.findById(Long.valueOf(billSequence));
            if (billOpt.isEmpty()) {
                return AiToolResult.error("redeemPledge", "Pledge no longer found.");
            }
            Bill bill = billOpt.get();
            bill.setRedemptionStatus('C');
            bill.setRedemptionDate(LocalDate.now());
            billRepository.save(bill);
            
            return AiToolResult.success("redeemPledge", "pledge_card", billToMap(bill),
                "Pledge " + bill.getBillSerial() + bill.getBillNo() + " has been redeemed successfully.");
        } catch (Exception e) {
            return AiToolResult.error("redeemPledge", "Failed to redeem pledge: " + e.getMessage());
        }
    }

    private AiToolResult executeSearchInventory(Map<String, Object> args) {
        String metalType = (String) args.getOrDefault("metalType", null);
        String category = (String) args.getOrDefault("category", null);
        String status = (String) args.getOrDefault("status", null);
        String search = (String) args.getOrDefault("search", null);

        // Use existing purchaseItemsService or direct repository
        List<PurchaseItems> items;
        try {
            items = purchaseItemsService.getAllPurchaseItems();
            
            // Apply filters
            if (metalType != null) {
                items = items.stream()
                    .filter(i -> i.getMetalType() != null && i.getMetalType().name().equalsIgnoreCase(metalType))
                    .collect(Collectors.toList());
            }
            if (category != null) {
                items = items.stream()
                    .filter(i -> i.getCategory() != null && i.getCategory().equalsIgnoreCase(category))
                    .collect(Collectors.toList());
            }
            if (status != null) {
                items = items.stream()
                    .filter(i -> i.getStatus() != null && i.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
            } else {
                // Default to available items
                items = items.stream()
                    .filter(i -> i.getStatus() == null || i.getStatus().equalsIgnoreCase("AVAILABLE"))
                    .collect(Collectors.toList());
            }
            if (search != null) {
                String searchLower = search.toLowerCase();
                items = items.stream()
                    .filter(i -> (i.getItemName() != null && i.getItemName().toLowerCase().contains(searchLower)) ||
                                (i.getHuid() != null && i.getHuid().toLowerCase().contains(searchLower)))
                    .collect(Collectors.toList());
            }

            // Apply weight filters
            if (args.containsKey("minWeight")) {
                double minW = toDouble(args.get("minWeight"));
                items = items.stream()
                    .filter(i -> i.getWeight() >= minW)
                    .collect(Collectors.toList());
            }
            if (args.containsKey("maxWeight")) {
                double maxW = toDouble(args.get("maxWeight"));
                items = items.stream()
                    .filter(i -> i.getWeight() <= maxW)
                    .collect(Collectors.toList());
            }
        } catch (Exception e) {
            return AiToolResult.error("searchInventory", "Error searching inventory: " + e.getMessage());
        }

        List<Map<String, Object>> itemData = items.stream()
            .limit(20)
            .map(this::purchaseItemToMap)
            .collect(Collectors.toList());

        String summary = itemData.isEmpty()
            ? "No inventory items found matching your criteria."
            : "Found " + itemData.size() + " item(s) in inventory.";

        return AiToolResult.success("searchInventory", "inventory_card", itemData, summary);
    }

    private AiToolResult executeLookupBarcode(Map<String, Object> args) {
        String barcodeValue = (String) args.get("barcodeValue");
        try {
            Optional<Barcode> barcodeOpt = barcodeGenerationService.findByBarcodeValue(barcodeValue);
            if (barcodeOpt.isEmpty()) {
                return AiToolResult.error("lookupBarcode", "No item found for barcode: " + barcodeValue);
            }
            Barcode barcode = barcodeOpt.get();
            
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("barcodeId", barcode.getId());
            data.put("barcodeValue", barcode.getBarcodeValue());
            data.put("tag", barcode.getTag());
            data.put("status", barcode.getStatus());
            data.put("printCount", barcode.getPrintCount());
            
            if (barcode.getPurchaseItems() != null) {
                data.put("item", purchaseItemToMap(barcode.getPurchaseItems()));
            }

            return AiToolResult.success("lookupBarcode", "inventory_card", data,
                "Found item for barcode " + barcodeValue);
        } catch (Exception e) {
            return AiToolResult.error("lookupBarcode", "Error looking up barcode: " + e.getMessage());
        }
    }

    private AiToolResult executeGenerateBarcode(Map<String, Object> args) {
        Long purchaseItemId = toLong(args.get("purchaseItemId"));
        try {
            PurchaseItems purchaseItem = purchaseItemsService.getPurchaseItemsById(purchaseItemId);
            if (purchaseItem == null) {
                return AiToolResult.error("generateBarcode", "Purchase item not found with ID: " + purchaseItemId);
            }
            Barcode barcode = barcodeGenerationService.createBarcode(purchaseItem, "AI_ASSISTANT");
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("barcodeId", barcode.getId());
            data.put("barcodeValue", barcode.getBarcodeValue());
            data.put("tag", barcode.getTag());
            data.put("status", barcode.getStatus());
            
            return AiToolResult.success("generateBarcode", "barcode_card", data,
                "Generated barcode: " + barcode.getBarcodeValue());
        } catch (Exception e) {
            return AiToolResult.error("generateBarcode", "Error generating barcode: " + e.getMessage());
        }
    }

    private AiToolResult executeCreateEstimate(Map<String, Object> args) {
        // This is a simplified version — the full estimate creation uses EstimateService
        try {
            Long customerId = toLong(args.get("customerId"));
            Optional<Customer> customerOpt = customerService.findById(customerId);
            if (customerOpt.isEmpty()) {
                return AiToolResult.error("createEstimate", "Customer not found with ID: " + customerId);
            }

            Map<String, Object> estimatePreview = new LinkedHashMap<>();
            estimatePreview.put("customerId", customerId);
            estimatePreview.put("customerName", customerOpt.get().getCustomerName());
            estimatePreview.put("items", args.get("items"));
            estimatePreview.put("goldRate", args.getOrDefault("goldRate", "Use current rate"));
            estimatePreview.put("silverRate", args.getOrDefault("silverRate", "Use current rate"));
            estimatePreview.put("status", "PREVIEW");
            estimatePreview.put("message", "Navigate to the Estimate page to finalize this estimate with calculated totals.");

            return AiToolResult.success("createEstimate", "estimate_card", estimatePreview,
                "Estimate preview created. Navigate to Estimates to finalize.");
        } catch (Exception e) {
            return AiToolResult.error("createEstimate", "Error creating estimate: " + e.getMessage());
        }
    }

    private AiToolResult executeCreateSale(Map<String, Object> args) {
        Long customerId = toLong(args.get("customerId"));
        
        // For sales, always require confirmation
        AiConfirmation confirmation = new AiConfirmation(
            "CREATE_SALE",
            "Create a new sale for customer ID " + customerId,
            Map.of(
                "customerId", customerId,
                "items", args.getOrDefault("itemIds", args.getOrDefault("barcodes", List.of())),
                "paymentType", args.getOrDefault("paymentType", "CASH")
            ),
            args
        );
        pendingConfirmations.put(confirmation.getConfirmationId(), confirmation);

        AiToolResult result = new AiToolResult();
        result.setToolName("createSale");
        result.setStatus("pending_confirmation");
        result.setDisplayType("confirmation");
        result.setData(confirmation);
        result.setSummary("Sale creation requires your confirmation. Please review the details.");
        return result;
    }

    private AiToolResult executeCreateSaleConfirmed(Map<String, Object> params) {
        return AiToolResult.success("createSale", "text", 
            Map.of("message", "Please navigate to the POS page to complete this sale with full calculation."),
            "Navigate to Jewellery POS to complete the sale with proper calculations.");
    }

    private AiToolResult executeGetGoldRate(Map<String, Object> args) {
        try {
            String goldRate = localStorage_getGoldRate();
            return AiToolResult.success("getGoldRate", "text", 
                Map.of("goldRate", goldRate, "unit", "per gram", "currency", "INR"),
                "Current gold rate: ₹" + goldRate + " per gram");
        } catch (Exception e) {
            return AiToolResult.error("getGoldRate", "Could not fetch gold rate: " + e.getMessage());
        }
    }

    private AiToolResult executeGetSilverRate(Map<String, Object> args) {
        try {
            String silverRate = localStorage_getSilverRate();
            return AiToolResult.success("getSilverRate", "text",
                Map.of("silverRate", silverRate, "unit", "per gram", "currency", "INR"),
                "Current silver rate: ₹" + silverRate + " per gram");
        } catch (Exception e) {
            return AiToolResult.error("getSilverRate", "Could not fetch silver rate: " + e.getMessage());
        }
    }

    private AiToolResult executeGetDashboardSummary(Map<String, Object> args) {
        try {
            Map<String, Object> summary = new LinkedHashMap<>();
            
            // Get today's pledges
            LocalDate today = LocalDate.now();
            List<Bill> todayBills = billService.findBillsBySearch(null, today, today, null, null, null, "desc", null);
            
            long todayPledges = todayBills.stream().filter(b -> b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'O').count();
            long todayRedemptions = todayBills.stream().filter(b -> b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'C').count();
            int todayPledgeAmount = todayBills.stream()
                .filter(b -> b.getRedemptionStatus() != null && b.getRedemptionStatus() == 'O')
                .mapToInt(b -> b.getAmount() != null ? b.getAmount() : 0).sum();

            summary.put("date", today.toString());
            summary.put("todayNewPledges", todayPledges);
            summary.put("todayRedemptions", todayRedemptions);
            summary.put("todayPledgeAmount", todayPledgeAmount);
            summary.put("todayTransactions", todayBills.size());

            return AiToolResult.success("getDashboardSummary", "dashboard_card", summary,
                String.format("Today: %d new pledges (₹%,d), %d redemptions, %d total transactions.",
                    todayPledges, todayPledgeAmount, todayRedemptions, todayBills.size()));
        } catch (Exception e) {
            return AiToolResult.error("getDashboardSummary", "Error getting dashboard: " + e.getMessage());
        }
    }

    private AiToolResult executeAnalyzeImage(Map<String, Object> args) {
        // Image analysis is handled by GeminiService directly (multimodal)
        // This tool is a placeholder — the actual analysis happens at the controller level
        String analysisType = (String) args.getOrDefault("analysisType", "jewellery");
        return AiToolResult.success("analyzeJewelleryImage", "image_analysis",
            Map.of("analysisType", analysisType, "note", "Image analysis performed by Gemini Vision"),
            "Image analysis completed.");
    }

    @SuppressWarnings("unchecked")
    private AiToolResult executeOpenStockInward(Map<String, Object> args) {
        String supplierName = (String) args.getOrDefault("supplierName", "");
        String comments = (String) args.getOrDefault("comments", "");
        List<Map<String, Object>> items = (List<Map<String, Object>>) args.get("items");
        if (items == null) items = new ArrayList<>();

        List<Map<String, Object>> cleanedItems = new ArrayList<>();
        for (Map<String, Object> it : items) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("itemName", it.getOrDefault("itemName", "Ornament"));
            row.put("category", it.getOrDefault("category", ""));
            row.put("itemType", it.getOrDefault("metalType", it.getOrDefault("itemType", "GOLD")));
            double gross = toDouble(it.get("grossweight"));
            if (gross == 0.0) gross = toDouble(it.get("weight"));
            row.put("grossweight", gross);
            double net = toDouble(it.get("netWeight"));
            if (net == 0.0) net = gross;
            row.put("netWeight", net);
            row.put("stoneWeight", toDouble(it.get("stoneWeight")));
            double purity = toDouble(it.get("purity"));
            if (purity == 0.0) purity = 91.6;
            row.put("purity", purity);
            row.put("rate", toDouble(it.get("rate")));
            row.put("makingCharges", toDouble(it.get("makingCharges")));
            int qty = toInt(it.get("quantity"));
            row.put("quantity", qty > 0 ? qty : 1);
            if (it.containsKey("huid")) row.put("huid", it.get("huid"));
            cleanedItems.add(row);
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("route", "jewellery/purchase");
        payload.put("screen", "Stock Inward / Purchase");
        Map<String, Object> prefillStock = new LinkedHashMap<>();
        prefillStock.put("supplierName", supplierName);
        prefillStock.put("comments", comments);
        prefillStock.put("items", cleanedItems);
        payload.put("prefillStock", prefillStock);
        payload.put("items", cleanedItems);

        String summary = String.format("Opening Stock Inward screen with %d item(s) pre-filled. You can review, edit details, and click Save or Print Barcode Labels directly on the screen.", cleanedItems.size());

        return AiToolResult.success("openStockInward", "navigation", payload, summary);
    }

    private AiToolResult executeOpenNewPledge(Map<String, Object> args) {
        String customerName = (String) args.getOrDefault("customerName", "");
        String phoneStr = (String) args.getOrDefault("phone", args.getOrDefault("phoneno", ""));
        String address = (String) args.getOrDefault("address", "");
        String article = (String) args.getOrDefault("article", args.getOrDefault("articleDescription", ""));
        double grams = toDouble(args.get("grams"));
        if (grams == 0.0) grams = toDouble(args.get("weight"));
        int amount = toInt(args.get("amount"));
        double roi = toDouble(args.get("rateOfInterest"));
        if (roi == 0.0) roi = 2.0;
        int qty = toInt(args.get("productQuantity"));
        if (qty == 0) qty = 1;
        String comments = (String) args.getOrDefault("comments", "");

        Long customerId = null;
        if (!customerName.trim().isEmpty() || !phoneStr.trim().isEmpty()) {
            try {
                List<Customer> matches;
                if (!phoneStr.trim().isEmpty() && phoneStr.matches("\\d{7,15}")) {
                    matches = customerService.findByPhoneNo(Long.parseLong(phoneStr));
                } else {
                    matches = customerService.findCustomersByName(customerName);
                }
                if (matches != null && !matches.isEmpty()) {
                    Customer best = matches.get(0);
                    customerId = best.getCustomerid();
                    if (address.isEmpty() && best.getAddress() != null) address = best.getAddress();
                    if (phoneStr.isEmpty() && best.getPhoneno() != null) phoneStr = String.valueOf(best.getPhoneno());
                }
            } catch (Exception e) {
                logger.debug("Could not lookup customer for prefill: {}", e.getMessage());
            }
        }

        Map<String, Object> prefillPledge = new LinkedHashMap<>();
        prefillPledge.put("customerName", customerName);
        prefillPledge.put("phone", phoneStr);
        prefillPledge.put("address", address);
        if (customerId != null) prefillPledge.put("customerId", customerId);
        prefillPledge.put("article", article);
        prefillPledge.put("grams", grams);
        prefillPledge.put("amount", amount);
        prefillPledge.put("rateOfInterest", roi);
        prefillPledge.put("productQuantity", qty);
        prefillPledge.put("comments", comments);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("route", "pledge");
        payload.put("screen", "New Pledge Bill");
        payload.put("prefillPledge", prefillPledge);

        String summary = String.format("Opening Pledge Bill screen for %s (Amount: ₹%,d, Article: %s, Weight: %.2fg, ROI: %.1f%%). Form pre-filled for your review and printing.",
            customerName, amount, article, grams, roi);

        return AiToolResult.success("openNewPledge", "navigation", payload, summary);
    }

    private AiToolResult executeNavigateTo(Map<String, Object> args) {
        String route = (String) args.get("route");
        String reason = (String) args.getOrDefault("reason", "");
        
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("route", route);
        data.put("reason", reason);
        if (args.containsKey("prefillData")) {
            data.put("prefillData", args.get("prefillData"));
        }

        return AiToolResult.success("navigateTo", "navigation",
            data,
            "Navigating to " + route + (reason.isEmpty() ? "" : " — " + reason));
    }

    // ==================== HELPER METHODS ====================

    private Map<String, Object> billToMap(Bill bill) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("billSequence", bill.getBillSequence());
        map.put("billSerial", bill.getBillSerial() != null ? bill.getBillSerial().toString() : "");
        map.put("billNo", bill.getBillNo());
        map.put("billDate", bill.getBillDate() != null ? bill.getBillDate().toString() : "");
        map.put("amount", bill.getAmount());
        map.put("presentValue", bill.getPresentValue());
        map.put("rateOfInterest", bill.getRateOfInterest());
        map.put("status", bill.getRedemptionStatus() != null ? (bill.getRedemptionStatus() == 'O' ? "OPEN" : "REDEEMED") : "UNKNOWN");
        map.put("articles", bill.getProductDescriptions());
        map.put("grams", bill.getGrams());
        if (bill.getCustomer() != null) {
            map.put("customerName", bill.getCustomer().getCustomerName());
            map.put("customerId", bill.getCustomer().getCustomerid());
            map.put("customerAddress", bill.getCustomer().getAddress() != null ? bill.getCustomer().getAddress() : "");
        }
        if (bill.getRedemptionDate() != null) {
            map.put("redemptionDate", bill.getRedemptionDate().toString());
        }
        if (bill.getInterest() != null) map.put("interest", bill.getInterest());
        if (bill.getTotal() != null) map.put("total", bill.getTotal());
        return map;
    }

    private Map<String, Object> purchaseItemToMap(PurchaseItems item) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", item.getId());
        map.put("itemName", item.getItemName() != null ? item.getItemName() : "");
        map.put("category", item.getCategory() != null ? item.getCategory() : "");
        map.put("metalType", item.getMetalType() != null ? item.getMetalType().name() : "");
        map.put("grossWeight", item.getGrossweight() != null ? item.getGrossweight() : item.getWeight());
        map.put("netWeight", item.getNetWeight());
        map.put("purity", item.getPurity());
        map.put("rate", item.getRate());
        map.put("amount", item.getAmount());
        map.put("status", item.getStatus());
        map.put("huid", item.getHuid() != null ? item.getHuid() : "");
        map.put("barcode", item.getBarcode() != null ? item.getBarcode().getBarcodeValue() : "");
        map.put("designNo", item.getDesignNo() != null ? item.getDesignNo() : "");
        map.put("location", item.getLocation() != null ? item.getLocation() : "");
        return map;
    }

    private double calculateSimilarity(String query, String target) {
        if (query == null || target == null) return 0.0;
        String q = query.toLowerCase().trim();
        String t = target.toLowerCase().trim();
        
        if (q.equals(t)) return 1.0;
        if (t.startsWith(q) || t.contains(q)) return 0.9;
        
        LevenshteinDistance ld = new LevenshteinDistance();
        int distance = ld.apply(q, t);
        int maxLen = Math.max(q.length(), t.length());
        if (maxLen == 0) return 1.0;
        
        return 1.0 - ((double) distance / maxLen);
    }

    private String categorizeSimilarity(double score) {
        if (score >= 0.95) return "EXACT";
        if (score >= 0.80) return "STRONG";
        if (score >= 0.60) return "POSSIBLE";
        return "WEAK";
    }

    private String localStorage_getGoldRate() {
        // Try to get from settings, fallback to a default
        try {
            List<Settings> settings = settingsRepository.findAll();
            for (Settings s : settings) {
                if (s != null && "gold_rate".equalsIgnoreCase(s.getParamId())) {
                    return s.getParamValue();
                }
            }
        } catch (Exception e) {
            logger.debug("Could not get gold rate from settings");
        }
        return "Not available — check the gold rate display in the application header.";
    }

    private String localStorage_getSilverRate() {
        try {
            List<Settings> settings = settingsRepository.findAll();
            for (Settings s : settings) {
                if (s != null && "silver_rate".equalsIgnoreCase(s.getParamId())) {
                    return s.getParamValue();
                }
            }
        } catch (Exception e) {
            logger.debug("Could not get silver rate from settings");
        }
        return "Not available — check the silver rate display in the application header.";
    }

    private Long toLong(Object val) {
        if (val == null) return 0L;
        if (val instanceof Long) return (Long) val;
        if (val instanceof Integer) return ((Integer) val).longValue();
        if (val instanceof Double) return ((Double) val).longValue();
        return Long.parseLong(val.toString());
    }

    private Integer toInt(Object val) {
        if (val == null) return 0;
        if (val instanceof Integer) return (Integer) val;
        if (val instanceof Long) return ((Long) val).intValue();
        if (val instanceof Double) return ((Double) val).intValue();
        return Integer.parseInt(val.toString());
    }

    private double toDouble(Object val) {
        if (val == null) return 0.0;
        if (val instanceof Double) return (Double) val;
        if (val instanceof Integer) return ((Integer) val).doubleValue();
        if (val instanceof Long) return ((Long) val).doubleValue();
        return Double.parseDouble(val.toString());
    }
}
