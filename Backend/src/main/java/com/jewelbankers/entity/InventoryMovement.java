package com.jewelbankers.entity;

import java.time.LocalDateTime;

import com.jewelbankers.enums.ItemStatus;
import com.jewelbankers.enums.MovementAction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "inventory_movements")
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "purchase_item_id")
    private Long purchaseItemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", length = 30)
    private MovementAction action;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 30)
    private ItemStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30)
    private ItemStatus newStatus;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @Column(name = "notes", length = 500)
    private String notes;

    @Column(name = "from_location", length = 200)
    private String fromLocation;

    @Column(name = "to_location", length = 200)
    private String toLocation;

    @PrePersist
    public void prePersist() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPurchaseItemId() { return purchaseItemId; }
    public void setPurchaseItemId(Long purchaseItemId) { this.purchaseItemId = purchaseItemId; }

    public MovementAction getAction() { return action; }
    public void setAction(MovementAction action) { this.action = action; }

    public ItemStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(ItemStatus oldStatus) { this.oldStatus = oldStatus; }

    public ItemStatus getNewStatus() { return newStatus; }
    public void setNewStatus(ItemStatus newStatus) { this.newStatus = newStatus; }

    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getFromLocation() { return fromLocation; }
    public void setFromLocation(String fromLocation) { this.fromLocation = fromLocation; }

    public String getToLocation() { return toLocation; }
    public void setToLocation(String toLocation) { this.toLocation = toLocation; }
}
