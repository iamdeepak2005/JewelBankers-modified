package com.jewelbankers.services.ai;

import java.util.*;
import org.springframework.stereotype.Service;

/**
 * Central registry of all AI tool declarations.
 * These are sent to Gemini as function declarations so it knows what operations
 * are available and can call them with appropriate parameters.
 * 
 * Each tool maps to an existing Spring Boot service method.
 */
@Service
public class AiToolRegistry {

    private final List<Map<String, Object>> toolDeclarations;

    public AiToolRegistry() {
        this.toolDeclarations = buildToolDeclarations();
    }

    public List<Map<String, Object>> getToolDeclarations() {
        return toolDeclarations;
    }

    private List<Map<String, Object>> buildToolDeclarations() {
        List<Map<String, Object>> tools = new ArrayList<>();

        // ==================== CUSTOMER TOOLS ====================
        
        tools.add(buildFunction("searchCustomers",
            "Search for customers by name, phone number, or address. Supports fuzzy/partial name matching. Returns customers with similarity scores.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "query", Map.of("type", "string", "description", "Customer name, phone number, or address to search for"),
                    "phone", Map.of("type", "string", "description", "Phone number to search (optional)")
                ),
                "required", List.of("query")
            )
        ));

        tools.add(buildFunction("getCustomerHistory",
            "Get complete transaction history for a customer including pledges, jewellery purchases, estimates. Requires customer ID.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "customerId", Map.of("type", "integer", "description", "The customer ID to get history for")
                ),
                "required", List.of("customerId")
            )
        ));

        // ==================== PAWNBROKER / PLEDGE TOOLS ====================
        
        tools.add(buildFunction("searchPledges",
            "Search pledges/bills with multiple filters. Status: 'O' for Open, 'C' for Closed/Redeemed. Can search by customer name, date range, article/product description, amount, bill number.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "customerName", Map.of("type", "string", "description", "Customer name to filter by (partial match supported)"),
                    "status", Map.of("type", "string", "description", "Pledge status: 'O' for Open, 'C' for Closed/Redeemed"),
                    "startDate", Map.of("type", "string", "description", "Start date filter in yyyy-MM-dd format"),
                    "endDate", Map.of("type", "string", "description", "End date filter in yyyy-MM-dd format"),
                    "article", Map.of("type", "string", "description", "Article/product description to search for"),
                    "billNumber", Map.of("type", "string", "description", "Bill number like A5072 or a5072"),
                    "amount", Map.of("type", "integer", "description", "Approximate amount to search near")
                )
            )
        ));

        tools.add(buildFunction("calculateRedemption",
            "Calculate the redemption amount for a pledge including principal, interest, and total. Uses the bill sequence number.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "billSequence", Map.of("type", "integer", "description", "The bill sequence number of the pledge")
                ),
                "required", List.of("billSequence")
            )
        ));

        tools.add(buildFunction("redeemPledge",
            "Initiate the redemption of a pledge. This is a FINANCIAL operation that requires user confirmation. Returns confirmation details.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "billSequence", Map.of("type", "integer", "description", "The bill sequence number to redeem")
                ),
                "required", List.of("billSequence")
            )
        ));

        // ==================== JEWELLERY / INVENTORY TOOLS ====================
        
        tools.add(buildFunction("searchInventory",
            "Search jewellery inventory. Can filter by metal type (GOLD/SILVER), category (RING/CHAIN/BANGLE/etc), status (AVAILABLE/SOLD/RESERVED), weight range, search text.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "metalType", Map.of("type", "string", "description", "Metal type: GOLD or SILVER"),
                    "category", Map.of("type", "string", "description", "Category: RING, CHAIN, BANGLE, BRACELET, NECKLACE, EARRING, PENDANT, ANKLET, COIN, etc."),
                    "status", Map.of("type", "string", "description", "Item status: AVAILABLE, SOLD, RESERVED, RETURNED"),
                    "search", Map.of("type", "string", "description", "Free text search across item name, barcode, HUID"),
                    "minWeight", Map.of("type", "number", "description", "Minimum gross weight in grams"),
                    "maxWeight", Map.of("type", "number", "description", "Maximum gross weight in grams"),
                    "maxPrice", Map.of("type", "number", "description", "Maximum price filter")
                )
            )
        ));

        tools.add(buildFunction("lookupBarcode",
            "Look up a jewellery item by its barcode value. Returns complete item details if found.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "barcodeValue", Map.of("type", "string", "description", "The barcode value to look up (e.g., JW000000001)")
                ),
                "required", List.of("barcodeValue")
            )
        ));

        tools.add(buildFunction("generateBarcode",
            "Generate a unique barcode for a jewellery inventory item. Requires the purchase item ID.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "purchaseItemId", Map.of("type", "integer", "description", "The purchase item ID to generate a barcode for")
                ),
                "required", List.of("purchaseItemId")
            )
        ));

        // ==================== ESTIMATE & SALE TOOLS ====================
        
        tools.add(buildFunction("createEstimate",
            "Create a rough estimate for a customer with multiple jewellery items. Returns the estimate with calculated totals.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "customerId", Map.of("type", "integer", "description", "Customer ID for the estimate"),
                    "items", Map.of("type", "array", "description", "List of items with details",
                        "items", Map.of("type", "object", "properties", Map.of(
                            "itemName", Map.of("type", "string"),
                            "metalType", Map.of("type", "string"),
                            "grossWeight", Map.of("type", "number"),
                            "stoneWeight", Map.of("type", "number"),
                            "purity", Map.of("type", "number"),
                            "rate", Map.of("type", "number"),
                            "makingCharge", Map.of("type", "number")
                        ))
                    ),
                    "goldRate", Map.of("type", "number", "description", "Gold rate per gram"),
                    "silverRate", Map.of("type", "number", "description", "Silver rate per gram")
                ),
                "required", List.of("customerId", "items")
            )
        ));

        tools.add(buildFunction("createSale",
            "Create a sale/bill for a customer. This is a FINANCIAL operation requiring confirmation. Pass item IDs or barcode values.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "customerId", Map.of("type", "integer", "description", "Customer ID for the sale"),
                    "itemIds", Map.of("type", "array", "description", "List of purchase item IDs to sell",
                        "items", Map.of("type", "integer")),
                    "barcodes", Map.of("type", "array", "description", "List of barcode values to sell",
                        "items", Map.of("type", "string")),
                    "paymentType", Map.of("type", "string", "description", "Payment type: CASH, UPI, CARD, CHEQUE, CREDIT")
                ),
                "required", List.of("customerId")
            )
        ));

        // ==================== RATES & DASHBOARD ====================
        
        tools.add(buildFunction("getGoldRate",
            "Get the current gold rate (per gram). Returns the latest gold price.",
            Map.of("type", "object", "properties", Map.of())
        ));

        tools.add(buildFunction("getSilverRate",
            "Get the current silver rate (per gram). Returns the latest silver price.",
            Map.of("type", "object", "properties", Map.of())
        ));

        tools.add(buildFunction("getDashboardSummary",
            "Get today's business summary: total sales, pledges, redemptions, inventory counts, and revenue figures.",
            Map.of("type", "object", "properties", Map.of())
        ));

        // ==================== IMAGE ANALYSIS ====================
        
        tools.add(buildFunction("analyzeJewelleryImage",
            "Analyze a jewellery image to detect type, metal, purity marks, HUID, and visual characteristics. The image is already provided in the message.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "analysisType", Map.of("type", "string", "description", "Type of analysis: 'jewellery' for jewellery identification, 'document' for document/bill reading, 'barcode' for barcode detection")
                ),
                "required", List.of("analysisType")
            )
        ));

        // ==================== SCREEN PRE-FILL & NAVIGATION TOOLS ====================

        tools.add(buildFunction("openStockInward",
            "Open the Stock Inward (Jewellery Purchase) screen and automatically pre-fill purchase items so the user can review, edit, and click Save or Print Barcodes directly on the screen. Use this whenever the user wants to add stock, inward jewellery items, or enter new purchase items.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "supplierName", Map.of("type", "string", "description", "Supplier / Dealer name (optional)"),
                    "comments", Map.of("type", "string", "description", "Notes or bill reference (optional)"),
                    "items", Map.of("type", "array", "description", "List of jewellery items to add to stock",
                        "items", Map.of("type", "object", "properties", Map.ofEntries(
                            Map.entry("itemName", Map.of("type", "string", "description", "Name of the item (e.g., Gold Ring, Silver Anklet, 22K Necklace)")),
                            Map.entry("metalType", Map.of("type", "string", "description", "Metal type: GOLD or SILVER")),
                            Map.entry("category", Map.of("type", "string", "description", "Category: RING, CHAIN, BANGLE, BRACELET, NECKLACE, EARRING, PENDANT, ANKLET, COIN, etc.")),
                            Map.entry("grossweight", Map.of("type", "number", "description", "Gross weight in grams")),
                            Map.entry("netWeight", Map.of("type", "number", "description", "Net weight in grams (if not specified, equals gross weight)")),
                            Map.entry("stoneWeight", Map.of("type", "number", "description", "Stone weight in grams (default 0)")),
                            Map.entry("purity", Map.of("type", "number", "description", "Purity percentage (e.g. 91.6 for 22K, 75.0 for 18K, 99.9 for 24K)")),
                            Map.entry("rate", Map.of("type", "number", "description", "Purchase rate per gram (optional)")),
                            Map.entry("makingCharges", Map.of("type", "number", "description", "Making charges (optional)")),
                            Map.entry("quantity", Map.of("type", "integer", "description", "Number of pieces (default 1)")),
                            Map.entry("huid", Map.of("type", "string", "description", "HUID 6-digit hallmark alphanumeric code (optional)"))
                        ),
                        "required", List.of("itemName", "grossweight")
                    ))
                ),
                "required", List.of("items")
            )
        ));

        tools.add(buildFunction("openNewPledge",
            "Open the Pawn/Pledge Bill creation screen and automatically pre-fill customer and pledge details so the user can verify, adjust interest or amount, and print/save the pledge bill directly on the screen. Use this whenever the user wants to create a new pledge/girvi/loan.",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "customerName", Map.of("type", "string", "description", "Customer full name"),
                    "phone", Map.of("type", "string", "description", "Customer mobile or phone number"),
                    "address", Map.of("type", "string", "description", "Customer address/place"),
                    "article", Map.of("type", "string", "description", "Article/item description (e.g., 1 Gold Chain, 2 Gold Bangles)"),
                    "grams", Map.of("type", "number", "description", "Total weight in grams (e.g. 15.5)"),
                    "amount", Map.of("type", "integer", "description", "Pledge/loan amount in Rupees (e.g. 40000)"),
                    "rateOfInterest", Map.of("type", "number", "description", "Monthly interest rate in percent (e.g. 1.5, 2.0, default 2.0)"),
                    "productQuantity", Map.of("type", "integer", "description", "Total quantity of articles pledged (default 1)"),
                    "comments", Map.of("type", "string", "description", "Notes or remarks (optional)")
                ),
                "required", List.of("customerName", "article", "grams", "amount")
            )
        ));

        // ==================== NAVIGATION ====================
        
        tools.add(buildFunction("navigateTo",
            "Navigate the application to a specific page. Available routes: 'pledge' (new pledge), 'redeem' (redeem pledge), 'search' (search page), 'jewellery/pos' (point of sale), 'jewellery/inventory' (inventory), 'jewellery/estimate' (estimates), 'jewellery/purchase' (stock addition), 'jewellery/barcodes' (barcode center), 'jewellery/dashboard' (jewellery dashboard), 'setting' (settings).",
            Map.of(
                "type", "object",
                "properties", Map.of(
                    "route", Map.of("type", "string", "description", "The application route to navigate to"),
                    "reason", Map.of("type", "string", "description", "Why navigating there (shown to user)"),
                    "prefillData", Map.of("type", "object", "description", "Optional prefill data to pass to the target screen")
                ),
                "required", List.of("route")
            )
        ));

        return tools;
    }

    private Map<String, Object> buildFunction(String name, String description, Map<String, Object> parameters) {
        Map<String, Object> func = new LinkedHashMap<>();
        func.put("name", name);
        func.put("description", description);
        func.put("parameters", parameters);
        return func;
    }
}
