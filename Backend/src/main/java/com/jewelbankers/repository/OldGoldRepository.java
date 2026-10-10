package com.jewelbankers.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.jewelbankers.entity.OldGold;

@Repository
public interface OldGoldRepository extends JpaRepository<OldGold, Long>, JpaSpecificationExecutor<OldGold> {
    List<OldGold> findByCustomerCustomerid(Long customerId);
    List<OldGold> findBySaleId(Long saleId);
    List<OldGold> findByStatus(String status);
}
