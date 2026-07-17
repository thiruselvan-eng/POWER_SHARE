package com.powershare.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that intercepts every request, extracts the JWT from the Authorization
 * header, validates it, and sets the authentication in the SecurityContext.
 *
 * Skipped entirely for:
 *   - OPTIONS preflight requests (browser CORS handshake must not be blocked)
 *   - Public /api/auth/** endpoints (login, register — no token expected)
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    /** Paths that should bypass JWT validation entirely. */
    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/auth/**",
        "/api/listings/public/**"
    );

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    /**
     * Returns {@code true} (skip this filter) for:
     * <ul>
     *   <li>HTTP OPTIONS — preflight must never be intercepted by the JWT filter</li>
     *   <li>Public paths that don't require a JWT</li>
     * </ul>
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Skip all CORS preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        // Skip public API paths
        String path = request.getServletPath();
        return PUBLIC_PATHS.stream()
                .anyMatch(pattern -> PATH_MATCHER.match(pattern, path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Diagnostic log — visible in Render container logs.
        // Remove or lower to TRACE once integration is stable.
        log.info("[JWT Filter] {} {}", request.getMethod(), request.getServletPath());

        String token = extractJwtFromRequest(request);

        if (StringUtils.hasText(token)) {
            try {
                String username = jwtTokenProvider.extractUsername(token);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (jwtTokenProvider.validateToken(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                        log.debug("[JWT Filter] Authenticated user: {}", username);
                    }
                }
            } catch (Exception ex) {
                // Token invalid — clear context and continue unauthenticated
                log.warn("[JWT Filter] Invalid token: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
