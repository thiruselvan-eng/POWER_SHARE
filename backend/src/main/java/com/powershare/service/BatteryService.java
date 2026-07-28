package com.powershare.service;

import com.powershare.dto.BatteryRequest;
import com.powershare.dto.BatteryResponse;
import com.powershare.entity.Battery;
import com.powershare.entity.BatteryStatus;
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
public class BatteryService {

    private final BatteryRepository batteryRepository;
    private final UserRepository userRepository;
    private final EnergyListingRepository energyListingRepository;

    public List<BatteryResponse> getSellerBatteries(Long sellerId) {
        return batteryRepository.findBySellerId(sellerId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BatteryResponse createBattery(Long sellerId, BatteryRequest request) {
        if (batteryRepository.existsBySerialNumber(request.getSerialNumber())) {
            throw new BusinessException("Battery with serial number " + request.getSerialNumber() + " already exists.");
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller not found"));

        Battery battery = Battery.builder()
                .seller(seller)
                .name(request.getName())
                .batteryType(request.getBatteryType())
                .capacityKwh(request.getCapacityKwh())
                .availableEnergyKwh(request.getAvailableEnergyKwh())
                .healthRating(request.getHealthRating())
                .serialNumber(request.getSerialNumber())
                .imageUrl(request.getImageUrl())
                .status(request.getStatus() != null ? request.getStatus() : BatteryStatus.AVAILABLE)
                .build();

        batteryRepository.save(battery);
        return toResponse(battery);
    }

    @Transactional
    public BatteryResponse updateBattery(Long sellerId, Long batteryId, BatteryRequest request) {
        Battery battery = batteryRepository.findByIdAndSellerId(batteryId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Battery not found with ID " + batteryId + " for this seller."));

        if (batteryRepository.existsBySerialNumberAndIdNot(request.getSerialNumber(), batteryId)) {
            throw new BusinessException("Another battery with serial number " + request.getSerialNumber() + " already exists.");
        }

        battery.setName(request.getName());
        battery.setBatteryType(request.getBatteryType());
        battery.setCapacityKwh(request.getCapacityKwh());
        battery.setAvailableEnergyKwh(request.getAvailableEnergyKwh());
        battery.setHealthRating(request.getHealthRating());
        battery.setSerialNumber(request.getSerialNumber());
        battery.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) {
            battery.setStatus(request.getStatus());
        }

        batteryRepository.save(battery);
        return toResponse(battery);
    }

    @Transactional
    public void deleteBattery(Long sellerId, Long batteryId) {
        Battery battery = batteryRepository.findByIdAndSellerId(batteryId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Battery not found with ID " + batteryId + " for this seller."));

        if (battery.getStatus() != BatteryStatus.AVAILABLE) {
            throw new BusinessException("Cannot delete battery with status: " + battery.getStatus() + ". Only AVAILABLE batteries can be removed.");
        }

        // Remove associated listing first to maintain referential integrity
        energyListingRepository.findByBatteryId(batteryId)
                .ifPresent(energyListingRepository::delete);

        batteryRepository.delete(battery);
    }

    public BatteryResponse toResponse(Battery battery) {
        return BatteryResponse.builder()
                .id(battery.getId())
                .name(battery.getName())
                .batteryType(battery.getBatteryType())
                .capacityKwh(battery.getCapacityKwh())
                .availableEnergyKwh(battery.getAvailableEnergyKwh())
                .healthRating(battery.getHealthRating())
                .serialNumber(battery.getSerialNumber())
                .imageUrl(battery.getImageUrl())
                .status(battery.getStatus())
                .createdAt(battery.getCreatedAt())
                .updatedAt(battery.getUpdatedAt())
                .build();
    }
}
