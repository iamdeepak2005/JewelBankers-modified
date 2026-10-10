package com.jewelbankers.dto;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for AI chat endpoint.
 */
public class AiChatRequest {
    private String message;
    private String sessionId;
    private String imageBase64;
    private String mimeType;
    private String imageContext; // e.g., "jewellery_analysis", "document_scan", "barcode_scan"
    private List<Map<String, Object>> conversationHistory;

    public AiChatRequest() {}

    public AiChatRequest(String message) {
        this.message = message;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getImageContext() { return imageContext; }
    public void setImageContext(String imageContext) { this.imageContext = imageContext; }

    public List<Map<String, Object>> getConversationHistory() { return conversationHistory; }
    public void setConversationHistory(List<Map<String, Object>> conversationHistory) { this.conversationHistory = conversationHistory; }
}
