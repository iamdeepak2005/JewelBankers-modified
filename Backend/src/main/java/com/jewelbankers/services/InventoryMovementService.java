package com.jewelbankers.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jewelbankers.entity.InventoryMovement;
import com.jewelbankers.enums.ItemStatus;
import com.jewelbankers.enums.MovementAction;
import com.jewelbankers.repository.InventoryMovementRepository;

/**
 * Service for recording inventory movements (audit trail).
 * Every status change of a jewellery item is recorded here.
 */
@Service
public class InventoryMovementService {

    @Autowired
    private InventoryMovementRepository movementRepository;

    /**
     * Record a new inventory movement.
     */
    public InventoryMovement recordMovement(Long purchaseItemId, MovementAction action,
                                            ItemStatus oldStatus, ItemStatus newStatus,
                                            String referenceType, Long referenceId,
                                            String userName, String notes) {
        InventoryMovement movement = new InventoryMovement();
        movement.setPurchaseItemId(purchaseItemId);
        movement.setAction(action);
        movement.setOldStatus(oldStatus);
        movement.setNewStatus(newStatus);
        movement.setReferenceType(referenceType);
        movement.setReferenceId(referenceId);
        movement.setUserName(userName);
        movement.setTimestamp(LocalDateTime.now());
        movement.setNotes(notes);
        return movementRepository.save(movement);
    }

    /**
     * Record a movement with location tracking.
     */
    public InventoryMovement recordTransfer(Long purchaseItemId,
                                            String fromLocation, String toLocation,
                                            String userName, String notes) {
        InventoryMovement movement = new InventoryMovement();
        movement.setPurchaseItemId(purchaseItemId);
        movement.setAction(MovementAction.TRANSFER);
        movement.setFromLocation(fromLocation);
        movement.setToLocation(toLocation);
        movement.setUserName(userName);
        movement.setTimestamp(LocalDateTime.now());
        movement.setNotes(notes);
        return movementRepository.save(movement);
    }

    /**
     * Overloaded convenience method taking PurchaseItems directly
     */
    public InventoryMovement recordMovement(com.jewelbankers.entity.PurchaseItems item, MovementAction action,
                                            ItemStatus oldStatus, ItemStatus newStatus,
                                            String referenceType, Long referenceId,
                                            String userName, String notes) {
        Long itemId = item != null ? item.getId() : null;
        return recordMovement(itemId, action, oldStatus, newStatus, referenceType, referenceId, userName, notes);
    }

    public InventoryMovement recordTransfer(com.jewelbankers.entity.PurchaseItems item,
                                            String fromLocation, String toLocation, String notes) {
        Long itemId = item != null ? item.getId() : null;
        return recordTransfer(itemId, fromLocation, toLocation, "SYSTEM", notes);
    }

    /**
     * Get full movement history for an item, ordered by timestamp descending.
     */
    public List<InventoryMovement> getMovementHistory(Long purchaseItemId) {
        return movementRepository.findByPurchaseItemIdOrderByTimestampDesc(purchaseItemId);
    }

    public List<InventoryMovement> getMovementsForItem(Long purchaseItemId) {
        return getMovementHistory(purchaseItemId);
    }

    /**
     * Get all movements for a specific reference (e.g., all movements related to a sale).
     */
    public List<InventoryMovement> getMovementsByReference(String referenceType, Long referenceId) {
        return movementRepository.findByReferenceTypeAndReferenceId(referenceType, referenceId);
    }
}
