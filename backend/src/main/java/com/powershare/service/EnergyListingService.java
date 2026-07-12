package com.powershare.service;

import com.powershare.dto.EnergyListingRequest;
import com.powershare.dto.EnergyListingResponse;
import com.powershare.entity.Battery;
import com.powershare.entity.BatteryStatus;
import com.powershare.entity.EnergyListing;
import com.powershare.entity.User;
import com.powershare.exception.BusinessException;
import com.powershare.exception.ResourceNotFoundException;
import com.powershare.repository.BatteryRepository;
import com.powershare.repository.EnergyListingRepository;
import com.powershare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EnergyListingService {

    private final EnergyListingRepository energyListingRepository;
    private final BatteryRepository batteryRepository;
    private final UserRepository userRepository;
    private final BatteryService batteryService;

    public List<EnergyListingResponse> getSellerListings(Long sellerId) {
        return energyListingRepository.findBySellerId(sellerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public EnergyListingResponse createListing(Long sellerId, EnergyListingRequest request) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        Battery battery = batteryRepository.findByIdAndSellerId(request.getBatteryId(), sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Battery not found with ID " + request.getBatteryId() + " for this seller."));

        if (energyListingRepository.existsByBatteryId(battery.getId())) {
            throw new BusinessException("This battery is already associated with an energy listing. Edit that listing instead.");
        }

        if (battery.getStatus() != BatteryStatus.AVAILABLE) {
            throw new BusinessException("Battery must be in AVAILABLE status to list it. Current status: " + battery.getStatus());
        }

        EnergyListing listing = EnergyListing.builder()
                .seller(seller)
                .battery(battery)
                .pricePerKwh(request.getPricePerKwh())
                .deliveryRadiusKm(request.getDeliveryRadiusKm())
                .description(request.getDescription())
                .active(request.isActive())
                .build();

        energyListingRepository.save(listing);
        return toResponse(listing);
    }

    @Transactional
    public EnergyListingResponse updateListing(Long sellerId, Long listingId, EnergyListingRequest request) {
        EnergyListing listing = energyListingRepository.findByIdAndSellerId(listingId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID " + listingId + " for this seller."));

        // If trying to change battery, verify new battery
        if (!listing.getBattery().getId().equals(request.getBatteryId())) {
            Battery newBattery = batteryRepository.findByIdAndSellerId(request.getBatteryId(), sellerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Battery not found with ID " + request.getBatteryId() + " for this seller."));

            if (energyListingRepository.existsByBatteryId(newBattery.getId())) {
                throw new BusinessException("Selected battery is already listed elsewhere.");
            }

            if (newBattery.getStatus() != BatteryStatus.AVAILABLE) {
                throw new BusinessException("Selected battery status must be AVAILABLE. Current status: " + newBattery.getStatus());
            }
            listing.setBattery(newBattery);
        }

        listing.setPricePerKwh(request.getPricePerKwh());
        listing.setDeliveryRadiusKm(request.getDeliveryRadiusKm());
        listing.setDescription(request.getDescription());
        listing.setActive(request.isActive());

        energyListingRepository.save(listing);
        return toResponse(listing);
    }

    @Transactional
    public void deleteListing(Long sellerId, Long listingId) {
        EnergyListing listing = energyListingRepository.findByIdAndSellerId(listingId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found with ID " + listingId + " for this seller."));
        energyListingRepository.delete(listing);
    }

    public List<EnergyListingResponse> getActivePublicListings() {
        return energyListingRepository.findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private EnergyListingResponse toResponse(EnergyListing listing) {
        return EnergyListingResponse.builder()
                .id(listing.getId())
                .battery(batteryService.toResponse(listing.getBattery()))
                .pricePerKwh(listing.getPricePerKwh())
                .deliveryRadiusKm(listing.getDeliveryRadiusKm())
                .description(listing.getDescription())
                .active(listing.isActive())
                .sellerName(listing.getSeller().getFullName())
                .sellerId(listing.getSeller().getId())
                .sellerPhone(listing.getSeller().getPhone())
                .latitude(listing.getSeller().getLatitude())
                .longitude(listing.getSeller().getLongitude())
                .createdAt(listing.getCreatedAt())
                .updatedAt(listing.getUpdatedAt())
                .build();
    }
}
