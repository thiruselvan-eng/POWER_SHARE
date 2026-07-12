package com.powershare.controller;

import com.powershare.dto.EnergyListingRequest;
import com.powershare.dto.EnergyListingResponse;
import com.powershare.repository.UserRepository;
import com.powershare.service.EnergyListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/listings")
@RequiredArgsConstructor
public class SellerListingController {

    private final EnergyListingService energyListingService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<EnergyListingResponse>> getListings(@AuthenticationPrincipal UserDetails userDetails) {
        Long sellerId = getSellerId(userDetails);
        return ResponseEntity.ok(energyListingService.getSellerListings(sellerId));
    }

    @PostMapping
    public ResponseEntity<EnergyListingResponse> createListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EnergyListingRequest request) {
        Long sellerId = getSellerId(userDetails);
        EnergyListingResponse response = energyListingService.createListing(sellerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EnergyListingResponse> updateListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody EnergyListingRequest request) {
        Long sellerId = getSellerId(userDetails);
        return ResponseEntity.ok(energyListingService.updateListing(sellerId, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        Long sellerId = getSellerId(userDetails);
        energyListingService.deleteListing(sellerId, id);
        return ResponseEntity.noContent().build();
    }

    private Long getSellerId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();
    }
}
