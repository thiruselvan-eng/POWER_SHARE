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
                .capacityKwh(request.getCapacityKwh())
                .voltage(request.getVoltage())
                .batteryType(request.getBatteryType())
                .currentChargeKwh(request.getCurrentChargeKwh())
                .healthRating(request.getHealthRating())
                .serialNumber(request.getSerialNumber())
                .status(BatteryStatus.AVAILABLE)
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

        // Only allow editing charge / status if it's available or not active in a transaction
        // But let's support general info edits
        battery.setName(request.getName());
        battery.setCapacityKwh(request.getCapacityKwh());
        battery.setVoltage(request.getVoltage());
        battery.setBatteryType(request.getBatteryType());
        battery.setCurrentChargeKwh(request.getCurrentChargeKwh());
        battery.setHealthRating(request.getHealthRating());
        battery.setSerialNumber(request.getSerialNumber());

        batteryRepository.save(battery);
        return toResponse(battery);
    }

    @Transactional
    public void deleteBattery(Long sellerId, Long batteryId) {
        Battery battery = batteryRepository.findByIdAndSellerId(batteryId, sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Battery not found with ID " + batteryId + " for this seller."));

        if (battery.getStatus() != BatteryStatus.AVAILABLE) {
            throw new BusinessException("Cannot delete battery because its current status is " + battery.getStatus() + ".");
        }

        // If listing exists for this battery, delete it first to maintain referential integrity
        energyListingRepository.findByBatteryId(batteryId)
                .ifPresent(energyListingRepository::delete);

        batteryRepository.delete(battery);
    }

    public BatteryResponse toResponse(Battery battery) {
        return BatteryResponse.builder()
                .id(battery.getId())
                .name(battery.getName())
                .capacityKwh(battery.getCapacityKwh())
                .voltage(battery.getVoltage())
                .batteryType(battery.getBatteryType())
                .currentChargeKwh(battery.getCurrentChargeKwh())
                .healthRating(battery.getHealthRating())
                .serialNumber(battery.getSerialNumber())
                .status(battery.getStatus())
                .createdAt(battery.getCreatedAt())
                .updatedAt(battery.getUpdatedAt())
                .build();
    }
}
