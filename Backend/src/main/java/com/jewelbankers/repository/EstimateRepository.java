package com.jewelbankers.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.jewelbankers.entity.Estimate;
import com.jewelbankers.enums.EstimateStatus;

@Repository
public interface EstimateRepository extends JpaRepository<Estimate, Long>, JpaSpecificationExecutor<Estimate> {
    List<Estimate> findByStatus(EstimateStatus status);
    Optional<Estimate> findByEstimateNoAndEstimatePrefix(Long estimateNo, String estimatePrefix);
    List<Estimate> findByCustomerCustomerid(Long customerId);
}
