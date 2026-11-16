package com.studentmarketplace.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Brute-force guard for the password endpoints: at most N attempts per minute per client IP.
 *
 * <p>The state is in memory, so it is per application instance. In production Nginx adds a
 * second limit in front of the same routes; if the backend is scaled to several replicas this
 * filter must move to a shared store (Redis) or be replaced by Bucket4j/ShedLock-style storage.
 *
 * <p>The client IP comes from {@code request.getRemoteAddr()}. Spring's forwarded-header
 * handling (server.forward-headers-strategy: framework) already resolves X-Forwarded-For when
 * the application runs behind the reverse proxy, so raw headers are not parsed here — an
 * attacker cannot spoof the key by sending their own header.
 */
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;
    /** Upper bound on tracked clients, so a spray of random IPs cannot exhaust memory. */
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final int limit;
    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public LoginRateLimitFilter(int attemptsPerMinute) {
        this.limit = Math.max(1, attemptsPerMinute);
    }

    /** Only the password endpoints are limited; browsing and authenticated calls are not. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !(path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/client/auth/login")
                || path.equals("/api/client/auth/register"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String client = request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
        if (!allow(client)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":429,\"title\":\"Too Many Requests\","
                    + "\"detail\":\"Too many login attempts. Try again in a minute.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean allow(String client) {
        long now = System.currentTimeMillis();
        if (attempts.size() > MAX_TRACKED_CLIENTS) {
            attempts.clear();
        }
        Deque<Long> times = attempts.computeIfAbsent(client, key -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() >= WINDOW_MILLIS) {
                times.pollFirst();
            }
            if (times.size() >= limit) {
                return false;
            }
            times.addLast(now);
            return true;
        }
    }
}
