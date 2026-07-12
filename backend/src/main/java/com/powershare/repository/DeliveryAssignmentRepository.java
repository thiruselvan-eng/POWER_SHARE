package com.powershare.repository;

import com.powershare.entity.DeliveryAssignment;
import com.powershare.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryAssignmentRepository extends JpaRepository<DeliveryAssignment, Long> {

    List<DeliveryAssignment> findByDeliveryAgentId(Long agentId);

    List<DeliveryAssignment> findByDeliveryAgentIdAndStatusIn(Long agentId, List<DeliveryStatus> statuses);

    Optional<DeliveryAssignment> findByIdAndDeliveryAgentId(Long id, Long agentId);

    Optional<DeliveryAssignment> findByOrderId(Long orderId);

    // Orders accepted by seller (ACCEPTED status) that have NO delivery assignment yet
    @Query("SELECT o FROM Order o WHERE o.status = com.powershare.entity.OrderStatus.ACCEPTED " +
           "AND NOT EXISTS (SELECT d FROM DeliveryAssignment d WHERE d.order = o)")
    List<com.powershare.entity.Order> findAvailableOrdersForPickup();
}
