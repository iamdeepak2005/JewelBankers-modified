package com.jewelbankers.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for AI chat endpoint.
 * Contains the AI's text response, any tool execution results,
 * pending confirmations, and optional navigation commands.
 */
public class AiChatResponse {
    private String message;
    private String type; // "text", "tool_result", "confirmation_required", "error", "navigation"
    private List<AiToolResult> toolResults = new ArrayList<>();
    private AiConfirmation pendingConfirmation;
    private String navigateTo; // Angular route to navigate to
    private Map<String, Object> navigationData; // Optional prefill data for the target screen
    private List<Map<String, Object>> structuredData; // For cards, tables, etc.

    public AiChatResponse() {}

    public AiChatResponse(String message, String type) {
        this.message = message;
        this.type = type;
    }

    public static AiChatResponse text(String message) {
        return new AiChatResponse(message, "text");
    }

    public static AiChatResponse error(String message) {
        return new AiChatResponse(message, "error");
    }

    public static AiChatResponse navigation(String message, String route) {
        AiChatResponse resp = new AiChatResponse(message, "navigation");
        resp.setNavigateTo(route);
        return resp;
    }

    // Getters and Setters
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public List<AiToolResult> getToolResults() { return toolResults; }
    public void setToolResults(List<AiToolResult> toolResults) { this.toolResults = toolResults; }
    public void addToolResult(AiToolResult result) { this.toolResults.add(result); }

    public AiConfirmation getPendingConfirmation() { return pendingConfirmation; }
    public void setPendingConfirmation(AiConfirmation pendingConfirmation) { this.pendingConfirmation = pendingConfirmation; }

    public String getNavigateTo() { return navigateTo; }
    public void setNavigateTo(String navigateTo) { this.navigateTo = navigateTo; }

    public Map<String, Object> getNavigationData() { return navigationData; }
    public void setNavigationData(Map<String, Object> navigationData) { this.navigationData = navigationData; }

    public List<Map<String, Object>> getStructuredData() { return structuredData; }
    public void setStructuredData(List<Map<String, Object>> structuredData) { this.structuredData = structuredData; }
}
