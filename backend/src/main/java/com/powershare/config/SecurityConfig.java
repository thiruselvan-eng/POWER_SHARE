package com.powershare.config;

import com.powershare.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security configuration:
 * - Stateless JWT sessions
 * - Role-based endpoint protection
 * - CORS configured for Vercel frontend and local dev origins
 * - BCrypt password encoding
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final UserDetailsService userDetailsService;

    // ----------------------------------------------------------------
    // CORS: registered as a top-priority filter so it runs BEFORE
    // Spring Security and therefore before the JWT filter. This
    // guarantees that preflight (OPTIONS) responses always carry the
    // correct Access-Control-* headers even when the request itself
    // would otherwise be rejected by the security chain.
    // ----------------------------------------------------------------
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration());
        return new CorsFilter(source);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration());
        return source;
    }

    /**
     * Single source-of-truth for CORS rules shared by both the
     * CorsFilter bean and the Spring Security CORS integration.
     */
    private CorsConfiguration corsConfiguration() {
        CorsConfiguration config = new CorsConfiguration();

        // Explicit, exact-match origins (required when allowCredentials = true)
        config.setAllowedOriginPatterns(Arrays.asList(
            "https://power-share-six.vercel.app",   // Production Vercel frontend
            "https://*.vercel.app",                  // All Vercel preview deployments
            "http://localhost:5173",                 // Vite default dev port
            "http://localhost:5174",                 // Vite alternate dev port
            "http://localhost:3000"                  // CRA / alternative dev port
        ));

        config.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // Allow all request headers (Authorization, Content-Type, etc.)
        config.setAllowedHeaders(List.of("*"));

        // Expose the Authorization header so the browser can read the JWT
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));

        // Must be true for cookies / Authorization header to be forwarded
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour to reduce OPTIONS round-trips
        config.setMaxAge(3600L);

        return config;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            // Wire Spring Security's CORS support to the same config source
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow all OPTIONS preflight requests without authentication.
                // This is the critical line that was missing: Spring Security
                // was intercepting OPTIONS requests before CORS headers could
                // be added, causing the browser to reject the preflight.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/listings/public/**").permitAll()
                .requestMatchers("/ws/**").permitAll()

                // Role-protected endpoints
                .requestMatchers("/api/seller/**").hasAuthority("ROLE_SELLER")
                .requestMatchers("/api/buyer/**").hasAuthority("ROLE_BUYER")
                .requestMatchers("/api/delivery/**").hasAuthority("ROLE_DELIVERY")
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                // Everything else needs authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
