package com.jewelbankers.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jewelbankers.entity.Estimate;
import com.jewelbankers.entity.EstimateItem;
import com.jewelbankers.enums.EstimateStatus;
import com.jewelbankers.repository.EstimateRepository;

import jakarta.transaction.Transactional;

@Service
public class EstimateService {

    @Autowired
    private EstimateRepository estimateRepository;

    @Transactional
    public Estimate saveEstimate(Estimate estimate) {
        // Set estimate date if not provided
        if (estimate.getEstimateDate() == null) {
            estimate.setEstimateDate(LocalDateTime.now());
        }

        // Set valid until (default 7 days)
        if (estimate.getValidUntil() == null) {
            estimate.setValidUntil(estimate.getEstimateDate().plusDays(7));
        }

        // Set bidirectional references for items
        if (estimate.getEstimateItems() != null) {
            for (EstimateItem item : estimate.getEstimateItems()) {
                item.setEstimate(estimate);
            }
        }

        // Save the estimate
        Estimate saved = estimateRepository.save(estimate);

        // Set estimate number based on the generated ID
        if (saved.getEstimateNo() == null) {
            saved.setEstimateNo(saved.getId());
            saved = estimateRepository.save(saved);
        }

        return saved;
    }

    public Optional<Estimate> getEstimateById(Long id) {
        return estimateRepository.findById(id);
    }

    public List<Estimate> getAllEstimates() {
        return estimateRepository.findAll();
    }

    public List<Estimate> getEstimatesByStatus(EstimateStatus status) {
        return estimateRepository.findByStatus(status);
    }

    public List<Estimate> getEstimatesByCustomer(Long customerId) {
        return estimateRepository.findByCustomerCustomerid(customerId);
    }

    @Transactional
    public Estimate updateEstimate(Long id, Estimate estimateData) {
        Estimate existing = estimateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estimate not found: " + id));

        // Update fields
        existing.setGoldRate(estimateData.getGoldRate());
        existing.setSilverRate(estimateData.getSilverRate());
        existing.setSubtotal(estimateData.getSubtotal());
        existing.setCgst(estimateData.getCgst());
        existing.setSgst(estimateData.getSgst());
        existing.setDiscount(estimateData.getDiscount());
        existing.setRoundOff(estimateData.getRoundOff());
        existing.setGrandTotal(estimateData.getGrandTotal());
        existing.setValidUntil(estimateData.getValidUntil());
        existing.setNotes(estimateData.getNotes());

        // Update customer if provided
        if (estimateData.getCustomer() != null) {
            existing.setCustomer(estimateData.getCustomer());
        }

        // Replace items
        existing.getEstimateItems().clear();
        if (estimateData.getEstimateItems() != null) {
            for (EstimateItem item : estimateData.getEstimateItems()) {
                item.setEstimate(existing);
                existing.getEstimateItems().add(item);
            }
        }

        return estimateRepository.save(existing);
    }

    @Transactional
    public void cancelEstimate(Long id) {
        Estimate estimate = estimateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Estimate not found: " + id));
        estimate.setStatus(EstimateStatus.CANCELLED);
        estimateRepository.save(estimate);
    }

    @Transactional
    public Estimate markConverted(Long estimateId, Long saleId) {
        Estimate estimate = estimateRepository.findById(estimateId)
                .orElseThrow(() -> new RuntimeException("Estimate not found: " + estimateId));
        estimate.setStatus(EstimateStatus.CONVERTED);
        estimate.setConvertedSaleId(saleId);
        return estimateRepository.save(estimate);
    }

    public Estimate createEstimate(Estimate estimate) {
        return saveEstimate(estimate);
    }

    public List<Estimate> getActiveEstimates() {
        return getEstimatesByStatus(EstimateStatus.ACTIVE);
    }

    public List<Estimate> getEstimatesByCustomerId(Long customerId) {
        return getEstimatesByCustomer(customerId);
    }

    public Optional<Estimate> getEstimateByNumber(String estimateNumber) {
        try {
            Long estNo = Long.parseLong(estimateNumber);
            return estimateRepository.findAll().stream()
                    .filter(e -> e.getEstimateNo() != null && e.getEstimateNo().equals(estNo))
                    .findFirst();
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    public Estimate convertToSale(Long id, Long salesId) {
        return markConverted(id, salesId);
    }

    public void deleteEstimate(Long id) {
        estimateRepository.deleteById(id);
    }
}
