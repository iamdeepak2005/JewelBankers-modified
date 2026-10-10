package com.jewelbankers.dto;

import java.util.Map;
import java.util.UUID;

/**
 * Represents a pending confirmation for a write/financial operation.
 * The frontend must display this to the user and send back the confirmationId
 * to execute the operation.
 */
public class AiConfirmation {
    private String confirmationId;
    private String action; // "REDEEM_PLEDGE", "CREATE_SALE", "CANCEL_PLEDGE", etc.
    private String description; // Human-readable description of what will happen
    private Map<String, Object> details; // Details to display (pledge info, amounts, etc.)
    private Map<String, Object> parameters; // The original parameters to execute if confirmed

    public AiConfirmation() {
        this.confirmationId = UUID.randomUUID().toString();
    }

    public AiConfirmation(String action, String description, Map<String, Object> details, Map<String, Object> parameters) {
        this.confirmationId = UUID.randomUUID().toString();
        this.action = action;
        this.description = description;
        this.details = details;
        this.parameters = parameters;
    }

    // Getters and Setters
    public String getConfirmationId() { return confirmationId; }
    public void setConfirmationId(String confirmationId) { this.confirmationId = confirmationId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Map<String, Object> getDetails() { return details; }
    public void setDetails(Map<String, Object> details) { this.details = details; }

    public Map<String, Object> getParameters() { return parameters; }
    public void setParameters(Map<String, Object> parameters) { this.parameters = parameters; }
}
