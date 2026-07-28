package com.powershare.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "energy_listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnergyListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "battery_id", nullable = false, unique = true)
    private Battery battery;

    // ── Pricing ──────────────────────────────────────────────────────────────
    @NotNull
    @Column(name = "price_per_kwh", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerKwh;

    @NotNull
    @Column(name = "min_purchase_kwh", nullable = false)
    @Builder.Default
    private Double minPurchaseKwh = 1.0;

    // ── Location ─────────────────────────────────────────────────────────────
    @Column(name = "seller_latitude")
    private Double sellerLatitude;

    @Column(name = "seller_longitude")
    private Double sellerLongitude;

    @Column(name = "seller_address", columnDefinition = "TEXT")
    private String sellerAddress;

    @Column(name = "seller_area")
    private String sellerArea;

    @Column(name = "seller_city")
    private String sellerCity;

    @Column(name = "seller_state")
    private String sellerState;

    @Column(name = "seller_pincode")
    private String sellerPincode;

    // ── Delivery ──────────────────────────────────────────────────────────────
    @Column(name = "delivery_available", nullable = false)
    @Builder.Default
    private boolean deliveryAvailable = false;

    @Column(name = "max_delivery_distance_km")
    @Builder.Default
    private Double maxDeliveryDistanceKm = 0.0;

    @Column(name = "delivery_charge_per_km", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal deliveryChargePerKm = BigDecimal.ZERO;

    @Column(name = "estimated_delivery_time")
    private String estimatedDeliveryTime;

    // ── Availability ──────────────────────────────────────────────────────────
    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "available_until")
    private LocalDate availableUntil;

    // ── Meta ──────────────────────────────────────────────────────────────────
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "seller_contact")
    private String sellerContact;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
