package com.powershare.repository;

import com.powershare.entity.Battery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BatteryRepository extends JpaRepository<Battery, Long> {
    List<Battery> findBySellerId(Long sellerId);
    Optional<Battery> findByIdAndSellerId(Long id, Long sellerId);
    boolean existsBySerialNumber(String serialNumber);
    boolean existsBySerialNumberAndIdNot(String serialNumber, Long id);
}
