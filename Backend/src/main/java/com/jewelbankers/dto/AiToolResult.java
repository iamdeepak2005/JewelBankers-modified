package com.jewelbankers.dto;

import java.util.Map;

/**
 * Represents the result of a single AI tool execution.
 */
public class AiToolResult {
    private String toolName;
    private String status; // "success", "error", "pending_confirmation"
    private String displayType; // "pledge_card", "customer_card", "inventory_card", "table", "text", "chart", "image_analysis"
    private Object data; // The actual result data (list of pledges, customer info, etc.)
    private String summary; // Human-readable summary of what the tool did
    private Map<String, Object> metadata; // Additional info (count, filters used, etc.)

    public AiToolResult() {}

    public AiToolResult(String toolName, String status, String displayType, Object data, String summary) {
        this.toolName = toolName;
        this.status = status;
        this.displayType = displayType;
        this.data = data;
        this.summary = summary;
    }

    public static AiToolResult success(String toolName, String displayType, Object data, String summary) {
        return new AiToolResult(toolName, "success", displayType, data, summary);
    }

    public static AiToolResult error(String toolName, String message) {
        return new AiToolResult(toolName, "error", "text", null, message);
    }

    // Getters and Setters
    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDisplayType() { return displayType; }
    public void setDisplayType(String displayType) { this.displayType = displayType; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
