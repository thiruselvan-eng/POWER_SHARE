package com.powershare.controller;

import com.powershare.dto.EnergyListingResponse;
import com.powershare.service.EnergyListingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
