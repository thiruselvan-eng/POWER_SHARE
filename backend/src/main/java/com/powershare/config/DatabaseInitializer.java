package com.powershare.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs idempotent database migrations before DataSeeder and Spring JPA entity operations.
 * Auto-heals database schema when deploying to new environment (e.g. Render PostgreSQL / Supabase).
 */
@Component
@Order(1) // Run before DataSeeder (Order 2 or default)
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitializer.class);
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info(">>> DatabaseInitializer: Checking database schema and applying migrations...");
        try {
            // 1. Add available_energy_kwh column to batteries if missing
            jdbcTemplate.execute("ALTER TABLE batteries ADD COLUMN IF NOT EXISTS available_energy_kwh double precision;");

            // Populate available_energy_kwh if null
            jdbcTemplate.execute("UPDATE batteries SET available_energy_kwh = COALESCE(current_charge_kwh, capacity_kwh) WHERE available_energy_kwh IS NULL;");

            // Drop legacy NOT NULL constraints so new listing creation doesn't fail on legacy columns
            try { jdbcTemplate.execute("ALTER TABLE batteries ALTER COLUMN current_charge_kwh DROP NOT NULL;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE batteries ALTER COLUMN voltage DROP NOT NULL;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE batteries ALTER COLUMN serial_number DROP NOT NULL;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE energy_listings ALTER COLUMN delivery_radius_km DROP NOT NULL;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE energy_listings ADD COLUMN IF NOT EXISTS delivery_available boolean NOT NULL DEFAULT false;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE energy_listings ADD COLUMN IF NOT EXISTS min_purchase_kwh double precision;"); } catch (Exception ignored) {}

            // Drop old constraints
            try { jdbcTemplate.execute("ALTER TABLE batteries DROP CONSTRAINT IF EXISTS batteries_status_check;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE delivery_assignments DROP CONSTRAINT IF EXISTS fkal6lp5gq27djtgpdsn2907uq5;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("DROP TABLE IF EXISTS delivery_assignments;"); } catch (Exception ignored) {}
            try { jdbcTemplate.execute("ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;"); } catch (Exception ignored) {}

            // Clean up legacy roles
            try { jdbcTemplate.execute("UPDATE users SET role = 'ROLE_BUYER' WHERE role = 'ROLE_DELIVERY';"); } catch (Exception ignored) {}

            log.info(">>> DatabaseInitializer: Database schema migration completed successfully!");
        } catch (Exception e) {
            log.warn(">>> DatabaseInitializer warning (non-fatal): {}", e.getMessage());
        }
    }
}
