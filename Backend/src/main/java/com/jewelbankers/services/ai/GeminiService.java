package com.jewelbankers.services.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Core service for communicating with Google Gemini API.
 * Handles text chat, function calling (tool use), and multimodal (image)
 * requests.
 * 
 * This is the ONLY service that talks to the Gemini API.
 * All AI intelligence flows through here.
 */
@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String model;

    @Value("${gemini.vision.model:gemini-3.5-flash-lite}")
    private String visionModel;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta}")
    private String apiBaseUrl;

    private static final String SYSTEM_PROMPT = """
            You are JewelBankers AI Assistant — an intelligent operational assistant for a jewellery and pawnbroker business.

            You help employees perform daily operations through natural language. You can:

            PAWNBROKER OPERATIONS:
            - Search customers by name, phone, address (fuzzy matching supported)
            - Search pledges by customer name, status (O=Open, C=Closed/Redeemed), date range, article, amount
            - View customer transaction history
            - Calculate redemption amounts for open pledges
            - Initiate pledge redemption (requires confirmation)

            JEWELLERY OPERATIONS:
            - Search inventory by metal type (GOLD/SILVER), category, status, weight range
            - Look up items by barcode
            - Generate barcodes for inventory items
            - Create rough estimates for customers
            - Create sales/bills for customers
            - Analyze jewellery images (identify type, metal, markings)

            GENERAL:
            - Get current gold and silver rates
            - View dashboard/business summary
            - Navigate to specific application pages

            IMPORTANT RULES:
            1. For READ operations (search, view, calculate) — execute immediately.
            2. For WRITE/FINANCIAL operations (redeem, sell, cancel, delete) — ALWAYS require confirmation.
            3. NEVER invent data. If you can't find something, say so.
            4. Financial calculations MUST come from the backend tools, not from your own math.
            5. When searching customers, if multiple matches exist, show ALL matches and ask which one.
            6. NEVER auto-merge customers just because names are similar.
            7. For image analysis: clearly distinguish between AI-detected information and confirmed data.
            8. Use the tools provided. Do not guess at data that tools can retrieve.

            STATUS CODES for pledges: 'O' = Open, 'C' = Closed/Redeemed

            When the user asks something, determine the right tool to use and call it.
            Present results in a clear, structured way.
            If information is missing for an operation, ask for it conversationally.

            Respond in a professional but friendly tone. Keep responses concise.
            Use ₹ for currency. Use Indian number formatting where appropriate.
            """;

    public GeminiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    /**
     * Send a text message to Gemini with function calling support.
     * Returns the raw Gemini API response as a JsonNode.
     */
    public JsonNode chat(String userMessage, List<Map<String, Object>> conversationHistory,
            List<Map<String, Object>> toolDeclarations) throws Exception {

        ObjectNode requestBody = buildChatRequest(userMessage, null, conversationHistory, toolDeclarations);
        return callGeminiApi(model, requestBody);
    }

    /**
     * Send a multimodal request (text + image) to Gemini.
     */
    public JsonNode chatWithImage(String userMessage, String imageBase64, String mimeType,
            List<Map<String, Object>> conversationHistory,
            List<Map<String, Object>> toolDeclarations) throws Exception {

        ObjectNode requestBody = buildChatRequest(userMessage, null, conversationHistory, toolDeclarations);

        // Add image to the last user message
        ArrayNode contents = (ArrayNode) requestBody.get("contents");
        if (contents.size() > 0) {
            ObjectNode lastContent = (ObjectNode) contents.get(contents.size() - 1);
            ArrayNode parts = (ArrayNode) lastContent.get("parts");

            // Add inline image data
            ObjectNode imagePart = objectMapper.createObjectNode();
            ObjectNode inlineData = objectMapper.createObjectNode();
            inlineData.put("mimeType", mimeType != null ? mimeType : "image/jpeg");
            inlineData.put("data", imageBase64);
            imagePart.set("inlineData", inlineData);
            parts.add(imagePart);
        }

        return callGeminiApi(visionModel, requestBody);
    }

    /**
     * Send function call results back to Gemini for a follow-up response.
     */
    public JsonNode sendToolResults(List<Map<String, Object>> conversationHistory,
            List<Map<String, Object>> toolResults,
            List<Map<String, Object>> toolDeclarations) throws Exception {

        ObjectNode requestBody = objectMapper.createObjectNode();

        // System instruction
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode systemParts = objectMapper.createArrayNode();
        ObjectNode systemTextPart = objectMapper.createObjectNode();
        systemTextPart.put("text", SYSTEM_PROMPT);
        systemParts.add(systemTextPart);
        systemInstruction.set("parts", systemParts);
        requestBody.set("systemInstruction", systemInstruction);

        // Contents = conversation history + tool response
        ArrayNode contents = objectMapper.createArrayNode();

        // Add conversation history
        if (conversationHistory != null) {
            for (Map<String, Object> entry : conversationHistory) {
                contents.add(objectMapper.valueToTree(entry));
            }
        }

        // Add tool results as functionResponse in user role (required by Gemini REST API)
        ObjectNode toolResponseContent = objectMapper.createObjectNode();
        toolResponseContent.put("role", "user");
        ArrayNode toolResponseParts = objectMapper.createArrayNode();

        for (Map<String, Object> toolResult : toolResults) {
            ObjectNode functionResponse = objectMapper.createObjectNode();
            ObjectNode fnResp = objectMapper.createObjectNode();
            fnResp.put("name", (String) toolResult.get("name"));
            fnResp.set("response", objectMapper.valueToTree(toolResult.get("response")));
            functionResponse.set("functionResponse", fnResp);
            toolResponseParts.add(functionResponse);
        }

        toolResponseContent.set("parts", toolResponseParts);
        contents.add(toolResponseContent);

        requestBody.set("contents", contents);

        // Add tool declarations
        if (toolDeclarations != null && !toolDeclarations.isEmpty()) {
            ArrayNode tools = objectMapper.createArrayNode();
            ObjectNode toolObj = objectMapper.createObjectNode();
            ArrayNode functionDeclarations = objectMapper.createArrayNode();
            for (Map<String, Object> decl : toolDeclarations) {
                functionDeclarations.add(objectMapper.valueToTree(decl));
            }
            toolObj.set("functionDeclarations", functionDeclarations);
            tools.add(toolObj);
            requestBody.set("tools", tools);
        }

        // Generation config
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.3);
        generationConfig.put("maxOutputTokens", 4096);
        requestBody.set("generationConfig", generationConfig);

        return callGeminiApi(model, requestBody);
    }

    /**
     * Extract text from a Gemini response.
     */
    public String extractTextFromResponse(JsonNode response) {
        try {
            JsonNode candidates = response.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content");
                JsonNode parts = content.path("parts");
                if (parts.isArray()) {
                    StringBuilder text = new StringBuilder();
                    for (JsonNode part : parts) {
                        if (part.has("text")) {
                            text.append(part.get("text").asText());
                        }
                    }
                    return text.toString();
                }
            }
        } catch (Exception e) {
            logger.error("Error extracting text from Gemini response", e);
        }
        return "";
    }

    /**
     * Extract function calls from a Gemini response.
     * Returns a list of maps with "name" and "args" keys.
     */
    public List<Map<String, Object>> extractFunctionCalls(JsonNode response) {
        List<Map<String, Object>> functionCalls = new ArrayList<>();
        try {
            JsonNode candidates = response.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray()) {
                    for (JsonNode part : parts) {
                        if (part.has("functionCall")) {
                            JsonNode fc = part.get("functionCall");
                            Map<String, Object> call = new HashMap<>();
                            call.put("name", fc.get("name").asText());
                            if (fc.has("args")) {
                                Map<String, Object> args = objectMapper.convertValue(
                                        fc.get("args"), new TypeReference<Map<String, Object>>() {
                                        });
                                call.put("args", args);
                            } else {
                                call.put("args", new HashMap<>());
                            }
                            functionCalls.add(call);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error extracting function calls from Gemini response", e);
        }
        return functionCalls;
    }

    /**
     * Check if the response contains function calls.
     */
    public boolean hasFunctionCalls(JsonNode response) {
        try {
            JsonNode candidates = response.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray()) {
                    for (JsonNode part : parts) {
                        if (part.has("functionCall")) {
                            return true;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error checking function calls", e);
        }
        return false;
    }

    // ==================== Private Helpers ====================

    private ObjectNode buildChatRequest(String userMessage, String imageBase64,
            List<Map<String, Object>> conversationHistory,
            List<Map<String, Object>> toolDeclarations) {
        ObjectNode requestBody = objectMapper.createObjectNode();

        // System instruction
        ObjectNode systemInstruction = objectMapper.createObjectNode();
        ArrayNode systemParts = objectMapper.createArrayNode();
        ObjectNode systemTextPart = objectMapper.createObjectNode();
        systemTextPart.put("text", SYSTEM_PROMPT);
        systemParts.add(systemTextPart);
        systemInstruction.set("parts", systemParts);
        requestBody.set("systemInstruction", systemInstruction);

        // Contents
        ArrayNode contents = objectMapper.createArrayNode();

        // Add conversation history
        if (conversationHistory != null) {
            for (Map<String, Object> entry : conversationHistory) {
                contents.add(objectMapper.valueToTree(entry));
            }
        }

        // Add current user message
        ObjectNode userContent = objectMapper.createObjectNode();
        userContent.put("role", "user");
        ArrayNode userParts = objectMapper.createArrayNode();
        ObjectNode textPart = objectMapper.createObjectNode();
        textPart.put("text", userMessage);
        userParts.add(textPart);
        userContent.set("parts", userParts);
        contents.add(userContent);

        requestBody.set("contents", contents);

        // Tool declarations (function calling)
        if (toolDeclarations != null && !toolDeclarations.isEmpty()) {
            ArrayNode tools = objectMapper.createArrayNode();
            ObjectNode toolObj = objectMapper.createObjectNode();
            ArrayNode functionDeclarations = objectMapper.createArrayNode();
            for (Map<String, Object> decl : toolDeclarations) {
                functionDeclarations.add(objectMapper.valueToTree(decl));
            }
            toolObj.set("functionDeclarations", functionDeclarations);
            tools.add(toolObj);
            requestBody.set("tools", tools);
        }

        // Generation config
        ObjectNode generationConfig = objectMapper.createObjectNode();
        generationConfig.put("temperature", 0.3);
        generationConfig.put("maxOutputTokens", 4096);
        requestBody.set("generationConfig", generationConfig);

        return requestBody;
    }

    private JsonNode callGeminiApi(String modelName, ObjectNode requestBody) throws Exception {
        String url = apiBaseUrl + "/models/" + modelName + ":generateContent?key=" + apiKey;

        String bodyJson = objectMapper.writeValueAsString(requestBody);

        logger.info("Calling Gemini API: model={}", modelName);
        logger.debug("Request body: {}", bodyJson.length() > 2000 ? bodyJson.substring(0, 2000) + "..." : bodyJson);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            logger.error("Gemini API error: status={}, body={}", response.statusCode(), response.body());
            throw new RuntimeException("Gemini API error: " + response.statusCode() + " - " + response.body());
        }

        JsonNode responseJson = objectMapper.readTree(response.body());
        logger.info("Gemini response received successfully");

        return responseJson;
    }
}
