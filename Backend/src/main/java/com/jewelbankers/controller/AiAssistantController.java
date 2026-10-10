package com.jewelbankers.controller;

import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jewelbankers.aop.SwitchDatabase;
import com.jewelbankers.dto.*;
import com.jewelbankers.services.ai.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/jewelbankersapi/ai")
public class AiAssistantController {

    private static final Logger logger = LoggerFactory.getLogger(AiAssistantController.class);

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AiToolRegistry aiToolRegistry;

    @Autowired
    private AiToolExecutor aiToolExecutor;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Main conversation endpoint.
     * Accepts text and optional base64 image, routes through Gemini with function calling,
     * executes necessary tools, and returns rich AI response.
     */
    @SwitchDatabase
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        logger.info("AI chat request received: message='{}', hasImage={}, session={}", 
            request.getMessage(), request.getImageBase64() != null, request.getSessionId());

        try {
            if ((request.getMessage() == null || request.getMessage().trim().isEmpty()) 
                    && (request.getImageBase64() == null || request.getImageBase64().trim().isEmpty())) {
                return ResponseEntity.badRequest().body(AiChatResponse.error("Message or image is required"));
            }

            List<Map<String, Object>> toolDeclarations = aiToolRegistry.getToolDeclarations();
            List<Map<String, Object>> history = request.getConversationHistory();
            if (history == null) {
                history = new ArrayList<>();
            }

            // 1. Call Gemini API (text or multimodal)
            JsonNode geminiResponse;
            if (request.getImageBase64() != null && !request.getImageBase64().trim().isEmpty()) {
                String mimeType = request.getMimeType() != null ? request.getMimeType() : "image/jpeg";
                geminiResponse = geminiService.chatWithImage(
                    request.getMessage() != null ? request.getMessage() : "Analyze this image for jewellery details.",
                    request.getImageBase64(),
                    mimeType,
                    history,
                    toolDeclarations
                );
            } else {
                geminiResponse = geminiService.chat(request.getMessage(), history, toolDeclarations);
            }

            // 2. Extract function calls if any
            List<Map<String, Object>> functionCalls = geminiService.extractFunctionCalls(geminiResponse);

            if (functionCalls.isEmpty()) {
                // Direct natural language response
                String text = geminiService.extractTextFromResponse(geminiResponse);
                AiChatResponse response = AiChatResponse.text(text.isEmpty() ? "I processed your request." : text);
                return ResponseEntity.ok(response);
            }

            // 3. Execute tool calls
            AiChatResponse response = new AiChatResponse();
            response.setType("tool_result");
            List<Map<String, Object>> executedToolResultsForGemini = new ArrayList<>();

            for (Map<String, Object> call : functionCalls) {
                String toolName = (String) call.get("name");
                @SuppressWarnings("unchecked")
                Map<String, Object> args = (Map<String, Object>) call.get("args");
                if (args == null) args = Collections.emptyMap();

                AiToolResult toolResult = aiToolExecutor.executeTool(toolName, args);
                response.addToolResult(toolResult);

                if ("pending_confirmation".equals(toolResult.getStatus()) && toolResult.getData() instanceof AiConfirmation) {
                    response.setType("confirmation_required");
                    response.setPendingConfirmation((AiConfirmation) toolResult.getData());
                }

                if ("navigation".equals(toolResult.getDisplayType()) && toolResult.getData() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> navData = (Map<String, Object>) toolResult.getData();
                    response.setNavigateTo((String) navData.get("route"));
                    response.setNavigationData(navData);
                }

                // Prepare result to feed back into Gemini for follow-up response
                Map<String, Object> toolResultFeed = new HashMap<>();
                toolResultFeed.put("name", toolName);
                Map<String, Object> resultPayload = new HashMap<>();
                resultPayload.put("status", toolResult.getStatus());
                resultPayload.put("summary", toolResult.getSummary());
                resultPayload.put("data", toolResult.getData());
                toolResultFeed.put("response", resultPayload);
                executedToolResultsForGemini.add(toolResultFeed);
            }

            // 4. Send tool results back to Gemini for natural language synthesis
            try {
                JsonNode followUpResponse = geminiService.sendToolResults(
                    history, executedToolResultsForGemini, toolDeclarations);
                String followUpText = geminiService.extractTextFromResponse(followUpResponse);
                if (!followUpText.isEmpty()) {
                    response.setMessage(followUpText);
                } else if (!response.getToolResults().isEmpty()) {
                    response.setMessage(response.getToolResults().get(0).getSummary());
                }
            } catch (Exception e) {
                logger.warn("Could not get Gemini follow-up synthesis, using tool summary", e);
                if (!response.getToolResults().isEmpty()) {
                    response.setMessage(response.getToolResults().get(0).getSummary());
                } else {
                    response.setMessage("Action completed.");
                }
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error in AI chat controller", e);
            return ResponseEntity.internalServerError().body(AiChatResponse.error("Error processing AI request: " + e.getMessage()));
        }
    }

    /**
     * Endpoint to execute a confirmed high-risk/financial operation.
     */
    @SwitchDatabase
    @PostMapping("/confirm")
    public ResponseEntity<AiChatResponse> confirm(@RequestBody Map<String, String> body) {
        String confirmationId = body.get("confirmationId");
        if (confirmationId == null || confirmationId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(AiChatResponse.error("confirmationId is required"));
        }

        try {
            AiToolResult result = aiToolExecutor.executeConfirmedAction(confirmationId);
            AiChatResponse response = new AiChatResponse();
            response.setType("tool_result");
            response.addToolResult(result);
            response.setMessage(result.getSummary() != null ? result.getSummary() : "Action executed.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error executing confirmed action", e);
            return ResponseEntity.internalServerError().body(AiChatResponse.error("Error executing action: " + e.getMessage()));
        }
    }

    /**
     * Returns list of all available tool declarations.
     */
    @GetMapping("/tools")
    public ResponseEntity<List<Map<String, Object>>> getTools() {
        return ResponseEntity.ok(aiToolRegistry.getToolDeclarations());
    }

    /**
     * Health check endpoint for AI assistant subsystem.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("toolsCount", aiToolRegistry.getToolDeclarations().size());
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }
}
