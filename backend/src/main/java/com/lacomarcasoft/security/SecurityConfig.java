package com.lacomarcasoft.security;

import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.security.provisioning.InMemoryUserDetailsManager;

import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
    private final String adminPassword;
    public SecurityConfig(
            @Value("${app.security.admin-password:exampass}") String adminPassword
    ) {
        this.adminPassword = adminPassword;
    }
    @Bean
        public SecurityFilterChain securityFilterChain(
                HttpSecurity http
        ) throws Exception {


        http
                .csrf(
                        csrf -> csrf.disable()
                )
                .cors(
                        Customizer.withDefaults()
                )
                .authorizeHttpRequests(
                        auth -> auth

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        "/api/recuperacion/**"
                                )
                                .permitAll()

                                .requestMatchers(
                                        "/api/logs/**"
                                )
                                .hasRole("ADMIN")

                                .anyRequest()
                                .permitAll()
                );


        return http.build();

        }
    @Bean
    public CorsConfigurationSource corsConfigurationSource(){
        CorsConfiguration config =
                new CorsConfiguration();



        config.addAllowedOrigin(
                "http://localhost:5173"
        );
        config.addAllowedMethod(
                "*"
        );
        config.addAllowedHeader(
                "*"
        );
        config.setAllowCredentials(
                true
        );
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration(
                "/**",
                config
        );
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }
    @Bean
    public UserDetailsService userDetailsService(){
        UserDetails admin =
                User.builder()
                        .username("admin")
                        .password(
                                "{noop}" + adminPassword
                        )
                        .roles("ADMIN")
                        .build();
        return new InMemoryUserDetailsManager(
                admin
        );
    }
}