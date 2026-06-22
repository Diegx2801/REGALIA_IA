package com.regalia.backend.auth.infrastructure.ratelimit;

import com.regalia.backend.auth.security.AuthContext;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Propiedades de seguridad para el control de intentos fallidos de login.
 */
@Component
@ConfigurationProperties(prefix = "regalia.security.login-attempts")
public class LoginAttemptProperties {

    private Policy publicLogin = Policy.publicDefaults();
    private Policy adminLogin = Policy.adminDefaults();

    public Policy policyFor(AuthContext authContext) {
        return AuthContext.ADMIN.equals(authContext) ? adminLogin : publicLogin;
    }

    public Policy getPublicLogin() {
        return publicLogin;
    }

    public void setPublicLogin(Policy publicLogin) {
        this.publicLogin = publicLogin;
    }

    public Policy getAdminLogin() {
        return adminLogin;
    }

    public void setAdminLogin(Policy adminLogin) {
        this.adminLogin = adminLogin;
    }

    public static class Policy {

        private Rule perIdentity;
        private Rule perIp;

        private static Policy publicDefaults() {
            return new Policy(
                    new Rule(5, 10, 10),
                    new Rule(30, 10, 10)
            );
        }

        private static Policy adminDefaults() {
            return new Policy(
                    new Rule(3, 15, 15),
                    new Rule(15, 15, 15)
            );
        }

        public Policy() {
        }

        public Policy(Rule perIdentity, Rule perIp) {
            this.perIdentity = perIdentity;
            this.perIp = perIp;
        }

        public Rule getPerIdentity() {
            return perIdentity;
        }

        public void setPerIdentity(Rule perIdentity) {
            this.perIdentity = perIdentity;
        }

        public Rule getPerIp() {
            return perIp;
        }

        public void setPerIp(Rule perIp) {
            this.perIp = perIp;
        }
    }

    public static class Rule {

        private int maxFailedAttempts;
        private long windowMinutes;
        private long blockMinutes;

        public Rule() {
        }

        public Rule(int maxFailedAttempts, long windowMinutes, long blockMinutes) {
            this.maxFailedAttempts = maxFailedAttempts;
            this.windowMinutes = windowMinutes;
            this.blockMinutes = blockMinutes;
        }

        public int getMaxFailedAttempts() {
            return maxFailedAttempts;
        }

        public void setMaxFailedAttempts(int maxFailedAttempts) {
            this.maxFailedAttempts = maxFailedAttempts;
        }

        public long getWindowMinutes() {
            return windowMinutes;
        }

        public void setWindowMinutes(long windowMinutes) {
            this.windowMinutes = windowMinutes;
        }

        public long getBlockMinutes() {
            return blockMinutes;
        }

        public void setBlockMinutes(long blockMinutes) {
            this.blockMinutes = blockMinutes;
        }

        public Duration windowDuration() {
            return Duration.ofMinutes(windowMinutes);
        }

        public Duration blockDuration() {
            return Duration.ofMinutes(blockMinutes);
        }
    }
}
