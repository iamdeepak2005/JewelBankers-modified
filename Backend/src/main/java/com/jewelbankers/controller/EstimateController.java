package com.jewelbankers.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.jewelbankers.aop.SwitchDatabase;
import com.jewelbankers.entity.Estimate;
import com.jewelbankers.services.EstimateService;

@RestController
@RequestMapping("/jewelbankersapi/estimates")
@CrossOrigin(origins = "*")
@SwitchDatabase
public class EstimateController {

    @Autowired
    private EstimateService estimateService;

    @PostMapping
    public ResponseEntity<Estimate> createEstimate(@RequestBody Estimate estimate) {
        Estimate created = estimateService.createEstimate(estimate);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEstimateById(@PathVariable Long id) {
        return estimateService.getEstimateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/number/{estimateNumber}")
    public ResponseEntity<?> getEstimateByNumber(@PathVariable String estimateNumber) {
        return estimateService.getEstimateByNumber(estimateNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Estimate>> getActiveEstimates() {
        return ResponseEntity.ok(estimateService.getActiveEstimates());
    }

    @GetMapping("/all")
    public ResponseEntity<List<Estimate>> getAllEstimates() {
        return ResponseEntity.ok(estimateService.getAllEstimates());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Estimate>> getEstimatesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(estimateService.getEstimatesByCustomerId(customerId));
    }

    @PostMapping("/{id}/convert")
    public ResponseEntity<?> convertToSale(@PathVariable Long id, @RequestParam Long salesId) {
        Estimate converted = estimateService.convertToSale(id, salesId);
        if (converted != null) {
            return ResponseEntity.ok(converted);
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Estimate not found or already converted"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEstimate(@PathVariable Long id) {
        estimateService.deleteEstimate(id);
        return ResponseEntity.ok(Map.of("status", "DELETED", "id", id));
    }
}
