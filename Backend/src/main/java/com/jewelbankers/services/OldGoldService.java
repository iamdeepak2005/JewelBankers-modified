package com.jewelbankers.services;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.jewelbankers.entity.OldGold;
import com.jewelbankers.repository.OldGoldRepository;

import jakarta.transaction.Transactional;

@Service
public class OldGoldService {

    @Autowired
    private OldGoldRepository oldGoldRepository;

    @Transactional
    public OldGold saveOldGold(OldGold oldGold) {
        return oldGoldRepository.save(oldGold);
    }

    public Optional<OldGold> getOldGoldById(Long id) {
        return oldGoldRepository.findById(id);
    }

    public List<OldGold> getAllOldGold() {
        return oldGoldRepository.findAll();
    }

    public List<OldGold> getOldGoldByCustomer(Long customerId) {
        return oldGoldRepository.findByCustomerCustomerid(customerId);
    }

    public List<OldGold> getByCustomerId(Long customerId) {
        return getOldGoldByCustomer(customerId);
    }

    public List<OldGold> getOldGoldBySale(Long saleId) {
        return oldGoldRepository.findBySaleId(saleId);
    }

    @Transactional
    public OldGold linkToSale(Long oldGoldId, Long saleId) {
        OldGold oldGold = oldGoldRepository.findById(oldGoldId)
                .orElseThrow(() -> new RuntimeException("OldGold not found: " + oldGoldId));
        oldGold.setSaleId(saleId);
        oldGold.setStatus("EXCHANGED");
        return oldGoldRepository.save(oldGold);
    }

    public void deleteOldGold(Long id) {
        oldGoldRepository.deleteById(id);
    }
}
