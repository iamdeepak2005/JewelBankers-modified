package com.jewelbankers.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jewelbankers.entity.InventoryMovement;
import com.jewelbankers.enums.MovementAction;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByPurchaseItemIdOrderByTimestampDesc(Long purchaseItemId);
    List<InventoryMovement> findByAction(MovementAction action);
    List<InventoryMovement> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);
}
