package com.jewelbankers.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.jewelbankers.entity.Barcode;

@Repository
public interface BarcodeRepository extends JpaRepository<Barcode, Long>, JpaSpecificationExecutor<Barcode> {

    Barcode findByTag(String tag);

    Optional<Barcode> findByBarcodeValue(String barcodeValue);

    List<Barcode> findByStatus(String status);

    List<Barcode> findByPurchaseItemsId(Long purchaseItemId);

    @Query("SELECT MAX(b.id) FROM Barcode b")
    Long findMaxId();
}
