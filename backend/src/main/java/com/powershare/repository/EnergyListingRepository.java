package com.powershare.repository;

import com.powershare.entity.EnergyListing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnergyListingRepository extends JpaRepository<EnergyListing, Long> {
    List<EnergyListing> findBySellerId(Long sellerId);
    Optional<EnergyListing> findByIdAndSellerId(Long id, Long sellerId);
    List<EnergyListing> findByActiveTrue();
    boolean existsByBatteryId(Long batteryId);
    Optional<EnergyListing> findByBatteryId(Long batteryId);
}
