package com.powershare.controller;

import com.powershare.dto.BatteryRequest;
import com.powershare.dto.BatteryResponse;
import com.powershare.repository.UserRepository;
import com.powershare.service.BatteryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/batteries")
@RequiredArgsConstructor
public class SellerBatteryController {

    private final BatteryService batteryService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<BatteryResponse>> getBatteries(@AuthenticationPrincipal UserDetails userDetails) {
        Long sellerId = getSellerId(userDetails);
        return ResponseEntity.ok(batteryService.getSellerBatteries(sellerId));
    }

    @PostMapping
    public ResponseEntity<BatteryResponse> createBattery(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BatteryRequest request) {
        Long sellerId = getSellerId(userDetails);
        BatteryResponse response = batteryService.createBattery(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BatteryResponse> updateBattery(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody BatteryRequest request) {
        Long sellerId = getSellerId(userDetails);
        return ResponseEntity.ok(batteryService.updateBattery(sellerId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBattery(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long sellerId = getSellerId(userDetails);
        batteryService.deleteBattery(sellerId, id);
        return ResponseEntity.noContent().build();
    }

    private Long getSellerId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
