package com.powershare.specification;

import com.powershare.dto.MarketplaceSearchRequest;
import com.powershare.entity.Battery;
import com.powershare.entity.EnergyListing;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic JPA Specification builder for the marketplace listing search.
 * Each filter is optional — only applied when the caller provides a non-null value.
 */
public class ListingSpecification {

    private ListingSpecification() {}

    public static Specification<EnergyListing> build(MarketplaceSearchRequest req) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter for active listings only
            predicates.add(cb.isTrue(root.get("active")));

            Join<EnergyListing, Battery> battery = getOrJoinBattery(root);

            // ── Text search (battery name, city, description) ─────────────────────
            if (req.getQuery() != null && !req.getQuery().isBlank()) {
                String pattern = "%" + req.getQuery().toLowerCase() + "%";
                Predicate byName        = cb.like(cb.lower(battery.get("name")),        pattern);
                Predicate byCity        = cb.like(cb.lower(root.get("sellerCity")),     pattern);
                Predicate byDescription = cb.like(cb.lower(root.get("description")),    pattern);
                predicates.add(cb.or(byName, byCity, byDescription));
            }

            // ── Battery type ──────────────────────────────────────────────────────
            if (req.getBatteryType() != null && !req.getBatteryType().isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(battery.get("batteryType")),
                        req.getBatteryType().toLowerCase()
                ));
            }

            // ── Capacity range ────────────────────────────────────────────────────
            if (req.getMinCapacityKwh() != null) {
                predicates.add(cb.greaterThanOrEqualTo(battery.get("capacityKwh"), req.getMinCapacityKwh()));
            }
            if (req.getMaxCapacityKwh() != null) {
                predicates.add(cb.lessThanOrEqualTo(battery.get("capacityKwh"), req.getMaxCapacityKwh()));
            }

            // ── Price range ───────────────────────────────────────────────────────
            if (req.getMinPricePerKwh() != null) {
                predicates.add(cb.greaterThanOrEqualTo(
                        root.get("pricePerKwh"),
                        BigDecimal.valueOf(req.getMinPricePerKwh())
                ));
            }
            if (req.getMaxPricePerKwh() != null) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("pricePerKwh"),
                        BigDecimal.valueOf(req.getMaxPricePerKwh())
                ));
            }

            // ── Battery health ────────────────────────────────────────────────────
            if (req.getMinHealthPct() != null) {
                predicates.add(cb.greaterThanOrEqualTo(battery.get("healthRating"), req.getMinHealthPct()));
            }

            // ── Delivery available ────────────────────────────────────────────────
            if (req.getDeliveryAvailable() != null && req.getDeliveryAvailable()) {
                predicates.add(cb.isTrue(root.get("deliveryAvailable")));
            }

            // ── Max delivery distance ─────────────────────────────────────────────
            if (req.getMaxDeliveryDistanceKm() != null && req.getMaxDeliveryDistanceKm() > 0) {
                predicates.add(cb.lessThanOrEqualTo(
                        root.get("maxDeliveryDistanceKm"),
                        req.getMaxDeliveryDistanceKm()
                ));
            }

            if (query != null) query.distinct(true);

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    @SuppressWarnings("unchecked")
    private static Join<EnergyListing, Battery> getOrJoinBattery(Root<EnergyListing> root) {
        for (Join<EnergyListing, ?> join : root.getJoins()) {
            if ("battery".equals(join.getAttribute().getName())) {
                return (Join<EnergyListing, Battery>) join;
            }
        }
        return root.join("battery", JoinType.LEFT);
    }
}
