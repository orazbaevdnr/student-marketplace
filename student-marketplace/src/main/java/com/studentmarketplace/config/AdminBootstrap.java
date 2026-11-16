package com.studentmarketplace.config;

import com.studentmarketplace.user.Role;
import com.studentmarketplace.user.User;
import com.studentmarketplace.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.Locale;

/** Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD if it does not exist yet. */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AppProperties props;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final Clock clock;

    public AdminBootstrap(AppProperties props, UserRepository users, PasswordEncoder encoder, Clock clock) {
        this.props = props;
        this.users = users;
        this.encoder = encoder;
        this.clock = clock;
    }

    @Override
    public void run(ApplicationArguments args) {
        AppProperties.Admin admin = props.admin();
        if (isBlank(admin.email()) || isBlank(admin.password())) {
            return;
        }
        String email = admin.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUniversityEmail(email)) {
            return;
        }
        users.save(new User(email, encoder.encode(admin.password()), "Administrator", Role.ADMIN, clock.instant()));
        log.info("Created administrator account {}", email);
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
