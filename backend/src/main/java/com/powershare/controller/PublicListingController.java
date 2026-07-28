package com.powershare.controller;

import com.powershare.dto.EnergyListingResponse;
import com.powershare.dto.MarketplaceSearchRequest;
import com.powershare.service.EnergyListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings/public")
@RequiredArgsConstructor
public class PublicListingController {

    private final EnergyListingService energyListingService;

    @GetMapping
    public ResponseEntity<List<EnergyListingResponse>> getPublicListings() {
        return ResponseEntity.ok(energyListingService.getActivePublicListings());
    }

    @PostMapping("/search")
    public ResponseEntity<Page<EnergyListingResponse>> searchListings(@RequestBody MarketplaceSearchRequest request) {
        return ResponseEntity.ok(energyListingService.searchListings(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EnergyListingResponse> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(energyListingService.getListingById(id));
    }
}
