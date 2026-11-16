package com.studentmarketplace.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
@EnableScheduling
@EnableCaching
public class AppConfig {

    /** One clock for the whole app, so "today" is the same everywhere and can be replaced in tests. */
    @Bean
    public Clock clock(AppProperties props) {
        return Clock.system(ZoneId.of(props.zone()));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
