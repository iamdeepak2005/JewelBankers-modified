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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jewelbankers.entity.OldGold;
import com.jewelbankers.services.OldGoldService;

@RestController
@RequestMapping("/jewelbankersapi/old-gold")
@CrossOrigin(origins = "http://localhost:4200")
public class OldGoldController {

    @Autowired
    private OldGoldService oldGoldService;

    @PostMapping
    public ResponseEntity<OldGold> createOldGold(@RequestBody OldGold oldGold) {
        OldGold created = oldGoldService.saveOldGold(oldGold);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOldGoldById(@PathVariable Long id) {
        return oldGoldService.getOldGoldById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<List<OldGold>> getAllOldGold() {
        return ResponseEntity.ok(oldGoldService.getAllOldGold());
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<OldGold>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(oldGoldService.getByCustomerId(customerId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOldGold(@PathVariable Long id) {
        oldGoldService.deleteOldGold(id);
        return ResponseEntity.ok(Map.of("status", "DELETED", "id", id));
    }
}
