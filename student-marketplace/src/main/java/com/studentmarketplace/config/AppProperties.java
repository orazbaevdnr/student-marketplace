package com.studentmarketplace.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

/** All custom settings, bound from the "app" section of application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        @DefaultValue("Asia/Almaty") String zone,
        @DefaultValue("") String allowedEmailDomain,
        @DefaultValue Jwt jwt,
        @DefaultValue Storage storage,
        @DefaultValue Stale stale,
        @DefaultValue Admin admin,
        @DefaultValue Cors cors,
        @DefaultValue Auth auth) {

    public record Jwt(String secret, @DefaultValue("60") long ttlMinutes) {
    }

    public record Storage(@DefaultValue("./data/photos") String dir,
                          @DefaultValue("5") int maxPhotosPerListing) {
    }

    public record Stale(@DefaultValue("30") int remindAfterDays,
                        @DefaultValue("37") int hideAfterDays,
                        @DefaultValue("0 0 3 * * *") String cron) {
    }

    public record Admin(String email, String password) {
    }

    public record Cors(@DefaultValue({"http://localhost:3000", "http://localhost:5173"}) List<String> allowedOrigins) {
    }

    /** Brute-force guard for the password endpoints, per client IP and minute. */
    public record Auth(@DefaultValue("20") int rateLimitPerMinute) {
    }
}
