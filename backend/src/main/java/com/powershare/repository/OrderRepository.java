package com.powershare.repository;

import com.powershare.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByBuyerId(Long buyerId);
    List<Order> findBySellerId(Long sellerId);
    Optional<Order> findByIdAndBuyerId(Long id, Long buyerId);
    Optional<Order> findByIdAndSellerId(Long id, Long sellerId);
}
