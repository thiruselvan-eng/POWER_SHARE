package com.powershare.service;

import com.powershare.dto.EnergyListingRequest;
import com.powershare.dto.EnergyListingResponse;
import com.powershare.dto.MarketplaceSearchRequest;
import com.powershare.entity.*;
import com.powershare.exception.BusinessException;
import com.powershare.exception.ResourceNotFoundException;
import com.powershare.repository.BatteryRepository;
import com.powershare.repository.EnergyListingRepository;
import com.powershare.repository.UserRepository;
import com.powershare.specification.ListingSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnergyListingService {

    private final EnergyListingRepository energyListingRepository;
    private final BatteryRepository batteryRepository;
    private final UserRepository userRepository;

    // ──────────────────────────────────────────────────────────────────────────
    // SELLER — Get own listings
    // ──────────────────────────────────────────────────────────────────────────

    public List<EnergyListingResponse> getSellerListings(Long sellerId) {
        return energyListingRepository.findBySellerId(sellerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SELLER — Create new listing (creates battery + listing atomically)
    // ──────────────────────────────────────────────────────────────────────────

    @Transactional
    public EnergyListingResponse createListing(Long sellerId, EnergyListingRequest request) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        // Validate: available energy cannot exceed capacity
        if (request.getAvailableEnergyKwh() > request.getCapacityKwh()) {
            throw new BusinessException("Available energy (" + request.getAvailableEnergyKwh() + " kWh) cannot exceed capacity (" + request.getCapacityKwh() + " kWh).");
        }

        // Validate: min purchase cannot exceed available energy
        if (request.getMinPurchaseKwh() != null && request.getMinPurchaseKwh() > request.getAvailableEnergyKwh()) {
            throw new BusinessException("Minimum purchase (" + request.getMinPurchaseKwh() + " kWh) cannot exceed available energy (" + request.getAvailableEnergyKwh() + " kWh).");
        }

        // Generate serial number if not provided
        String serialNumber = (request.getSerialNumber() != null && !request.getSerialNumber().isBlank())
                ? request.getSerialNumber()
                : "PS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Check serial uniqueness
        if (batteryRepository.existsBySerialNumber(serialNumber)) {
            throw new BusinessException("A battery with serial number '" + serialNumber + "' already exists.");
        }

        // Build battery
        BatteryStatus status = parseBatteryStatus(request.getBatteryStatus());
        Battery battery = Battery.builder()
                .seller(seller)
                .name(request.getBatteryName())
                .batteryType(request.getBatteryType())
                .capacityKwh(request.getCapacityKwh())
                .availableEnergyKwh(request.getAvailableEnergyKwh())
                .healthRating(request.getHealthRating())
                .serialNumber(serialNumber)
                .imageUrl(request.getImageUrl())
                .status(status)
                .build();

        // Build listing (cascade saves battery)
        EnergyListing listing = EnergyListing.builder()
                .seller(seller)
                .battery(battery)
                .pricePerKwh(request.getPricePerKwh())
                .minPurchaseKwh(request.getMinPurchaseKwh() != null ? request.getMinPurchaseKwh() : 1.0)
                .sellerLatitude(request.getSellerLatitude())
                .sellerLongitude(request.getSellerLongitude())
                .sellerAddress(request.getSellerAddress())
                .sellerArea(request.getSellerArea())
                .sellerCity(request.getSellerCity())
                .sellerState(request.getSellerState())
                .sellerPincode(request.getSellerPincode())
                .deliveryAvailable(request.isDeliveryAvailable())
                .maxDeliveryDistanceKm(request.getMaxDeliveryDistanceKm() != null ? request.getMaxDeliveryDistanceKm() : 0.0)
                .deliveryChargePerKm(request.getDeliveryChargePerKm())
                .estimatedDeliveryTime(request.getEstimatedDeliveryTime())
                .availableFrom(request.getAvailableFrom())
                .availableUntil(request.getAvailableUntil())
                .description(request.getDescription())
                .sellerContact(request.getSellerContact())
                .active(request.isActive())
                .build();

        energyListingRepository.save(listing);
        return toResponse(listing);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SELLER — Update listing (and its embedded battery)
    // ──────────────────────────────────────────────────────────────────────────

    @Transactional
    public EnergyListingResponse updateListing(Long sellerId, Long listingId, EnergyListingRequest request) {
        EnergyListing listing = energyListingRepository.findByIdAndSellerId(listingId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID " + listingId + " for this seller."));

        if (request.getAvailableEnergyKwh() > request.getCapacityKwh()) {
            throw new BusinessException("Available energy cannot exceed capacity.");
        }
        if (request.getMinPurchaseKwh() != null && request.getMinPurchaseKwh() > request.getAvailableEnergyKwh()) {
            throw new BusinessException("Minimum purchase cannot exceed available energy.");
        }

        // Update battery fields
        Battery battery = listing.getBattery();
        battery.setName(request.getBatteryName());
        battery.setBatteryType(request.getBatteryType());
        battery.setCapacityKwh(request.getCapacityKwh());
        battery.setAvailableEnergyKwh(request.getAvailableEnergyKwh());
        battery.setHealthRating(request.getHealthRating());
        battery.setImageUrl(request.getImageUrl());
        battery.setStatus(parseBatteryStatus(request.getBatteryStatus()));
        if (request.getSerialNumber() != null && !request.getSerialNumber().isBlank()) {
            // Only update serial if changed
            if (!request.getSerialNumber().equals(battery.getSerialNumber())) {
                if (batteryRepository.existsBySerialNumberAndIdNot(request.getSerialNumber(), battery.getId())) {
                    throw new BusinessException("Another battery with serial number '" + request.getSerialNumber() + "' already exists.");
                }
                battery.setSerialNumber(request.getSerialNumber());
            }
        }

        // Update listing fields
        listing.setPricePerKwh(request.getPricePerKwh());
        listing.setMinPurchaseKwh(request.getMinPurchaseKwh() != null ? request.getMinPurchaseKwh() : 1.0);
        listing.setSellerLatitude(request.getSellerLatitude());
        listing.setSellerLongitude(request.getSellerLongitude());
        listing.setSellerAddress(request.getSellerAddress());
        listing.setSellerArea(request.getSellerArea());
        listing.setSellerCity(request.getSellerCity());
        listing.setSellerState(request.getSellerState());
        listing.setSellerPincode(request.getSellerPincode());
        listing.setDeliveryAvailable(request.isDeliveryAvailable());
        listing.setMaxDeliveryDistanceKm(request.getMaxDeliveryDistanceKm() != null ? request.getMaxDeliveryDistanceKm() : 0.0);
        listing.setDeliveryChargePerKm(request.getDeliveryChargePerKm());
        listing.setEstimatedDeliveryTime(request.getEstimatedDeliveryTime());
        listing.setAvailableFrom(request.getAvailableFrom());
        listing.setAvailableUntil(request.getAvailableUntil());
        listing.setDescription(request.getDescription());
        listing.setSellerContact(request.getSellerContact());
        listing.setActive(request.isActive());

        energyListingRepository.save(listing);
        return toResponse(listing);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // SELLER — Delete listing (cascades to battery)
    // ──────────────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteListing(Long sellerId, Long listingId) {
        EnergyListing listing = energyListingRepository.findByIdAndSellerId(listingId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID " + listingId + " for this seller."));
        energyListingRepository.delete(listing); // cascade deletes battery
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUBLIC — Simple active listings (backward compat)
    // ──────────────────────────────────────────────────────────────────────────

    public List<EnergyListingResponse> getActivePublicListings() {
        return energyListingRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUBLIC — Dynamic search with Specification
    // ──────────────────────────────────────────────────────────────────────────

    public Page<EnergyListingResponse> searchListings(MarketplaceSearchRequest req) {
        Sort sort = buildSort(req.getSortBy());
        Pageable pageable = PageRequest.of(req.getPage(), req.getSize(), sort);
        Specification<EnergyListing> spec = ListingSpecification.build(req);
        return energyListingRepository.findAll(spec, pageable)
                .map(this::toResponse);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PUBLIC — Get single listing by ID
    // ──────────────────────────────────────────────────────────────────────────

    public EnergyListingResponse getListingById(Long id) {
        EnergyListing listing = energyListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID " + id));
        return toResponse(listing);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sortBy) {
            case "price_asc"      -> Sort.by(Sort.Direction.ASC,  "pricePerKwh");
            case "price_desc"     -> Sort.by(Sort.Direction.DESC, "pricePerKwh");
            case "capacity_desc"  -> Sort.by(Sort.Direction.DESC, "battery.capacityKwh");
            case "health_desc"    -> Sort.by(Sort.Direction.DESC, "battery.healthRating");
            default               -> Sort.by(Sort.Direction.DESC, "createdAt"); // newest
        };
    }

    private BatteryStatus parseBatteryStatus(String value) {
        if (value == null || value.isBlank()) return BatteryStatus.AVAILABLE;
        try {
            return BatteryStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return BatteryStatus.AVAILABLE;
        }
    }

    public EnergyListingResponse toResponse(EnergyListing listing) {
        Battery b = listing.getBattery();
        return EnergyListingResponse.builder()
                .id(listing.getId())
                .batteryId(b.getId())
                .batteryName(b.getName())
                .batteryType(b.getBatteryType())
                .capacityKwh(b.getCapacityKwh())
                .availableEnergyKwh(b.getAvailableEnergyKwh())
                .healthRating(b.getHealthRating())
                .batteryStatus(b.getStatus().name())
                .serialNumber(b.getSerialNumber())
                .imageUrl(b.getImageUrl())
                .pricePerKwh(listing.getPricePerKwh())
                .minPurchaseKwh(listing.getMinPurchaseKwh())
                .sellerLatitude(listing.getSellerLatitude())
                .sellerLongitude(listing.getSellerLongitude())
                .sellerAddress(listing.getSellerAddress())
                .sellerArea(listing.getSellerArea())
                .sellerCity(listing.getSellerCity())
                .sellerState(listing.getSellerState())
                .sellerPincode(listing.getSellerPincode())
                .deliveryAvailable(listing.isDeliveryAvailable())
                .maxDeliveryDistanceKm(listing.getMaxDeliveryDistanceKm())
                .deliveryChargePerKm(listing.getDeliveryChargePerKm())
                .estimatedDeliveryTime(listing.getEstimatedDeliveryTime())
                .availableFrom(listing.getAvailableFrom())
                .availableUntil(listing.getAvailableUntil())
                .description(listing.getDescription())
                .sellerContact(listing.getSellerContact())
                .active(listing.isActive())
                .sellerId(listing.getSeller().getId())
                .sellerName(listing.getSeller().getFullName())
                .sellerPhone(listing.getSeller().getPhone())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
