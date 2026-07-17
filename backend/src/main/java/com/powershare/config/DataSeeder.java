package com.powershare.config;

import com.powershare.entity.*;
import com.powershare.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Seeds the four platform demo accounts on every startup (idempotent —
 * each user is only inserted if their email does not already exist).
 *
 * This replaces the old "count() == 0" guard which prevented re-seeding
 * in an already-populated production database, causing Demo Login to fail
 * because seller@powershare.com, buyer@powershare.com, etc. were never
 * present in the Render PostgreSQL instance.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BatteryRepository batteryRepository;
    private final EnergyListingRepository energyListingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {

        // ── 1. Admin ───────────────────────────────────────────────────────────
        User admin = upsertUser(
                "admin@powershare.com",
                "Root Platform Admin",
                "adminpassword",
                Role.ROLE_ADMIN,
                null, null, null, null,
                BigDecimal.ZERO
        );

        // ── 2. Seller ──────────────────────────────────────────────────────────
        User seller = upsertUser(
                "seller@powershare.com",
                "Solar Max Energy",
                "sellerpassword",
                Role.ROLE_SELLER,
                "+155502932",
                "789 Sunny Boulevard, Los Angeles",
                34.0522,
                -118.2437,
                BigDecimal.valueOf(150.00)
        );

        // ── 3. Buyer ───────────────────────────────────────────────────────────
        upsertUser(
                "buyer@powershare.com",
                "John Resident",
                "buyerpassword",
                Role.ROLE_BUYER,
                "+155598103",
                "123 Green Lane, Los Angeles",
                34.0620,
                -118.2500,
                BigDecimal.valueOf(500.00)
        );

        // ── 4. Delivery ────────────────────────────────────────────────────────
        upsertUser(
                "delivery@powershare.com",
                "Green Courier Service",
                "deliverypassword",
                Role.ROLE_DELIVERY,
                "+155510293",
                "456 Depot Street, Los Angeles",
                34.0550,
                -118.2450,
                BigDecimal.valueOf(50.00)
        );

        // ── 5. Seed a sample battery + listing for the seller (once only) ──────
        if (!batteryRepository.findBySellerId(seller.getId()).isEmpty()) {
            log.info(">>> DataSeeder: demo accounts verified. Sample data already present — skipping battery seed.");
            return;
        }

        Battery battery = Battery.builder()
                .name("Tesla Powerwall 2")
                .capacityKwh(13.5)
                .voltage(230.0)
                .batteryType("Li-Ion")
                .currentChargeKwh(12.8)
                .healthRating(0.97)
                .serialNumber("PW-TSLA98124")
                .status(BatteryStatus.AVAILABLE)
                .seller(seller)
                .build();
        batteryRepository.save(battery);

        EnergyListing listing = EnergyListing.builder()
                .seller(seller)
                .battery(battery)
                .pricePerKwh(BigDecimal.valueOf(0.28))
                .deliveryRadiusKm(15.0)
                .description("High-performance Tesla Powerwall 2 battery cell package. Fully solar charged, ready to deliver.")
                .active(true)
                .build();
        energyListingRepository.save(listing);

        log.info(">>> DataSeeder: demo accounts and sample battery listing seeded successfully!");
    }

    /**
     * Insert the user only if their email is not already in the database.
     * Always ensures a wallet exists for the user.
     * Returns the persisted User entity (existing or newly created).
     */
    private User upsertUser(
            String email,
            String fullName,
            String rawPassword,
            Role role,
            String phone,
            String address,
            Double latitude,
            Double longitude,
            BigDecimal initialBalance
    ) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .phone(phone)
                    .address(address)
                    .latitude(latitude)
                    .longitude(longitude)
                    .isVerified(true)
                    .build();
            user = userRepository.save(user);

            // Only create wallet if one doesn't already exist
            final Long userId = user.getId();
            if (walletRepository.findByUserId(userId).isEmpty()) {
                Wallet wallet = Wallet.builder()
                        .user(user)
                        .balance(initialBalance)
                        .currency("USD")
                        .build();
                walletRepository.save(wallet);
            }

            log.info(">>> DataSeeder: created demo user [{}] ({})", email, role);
            return user;
        });
    }
}
