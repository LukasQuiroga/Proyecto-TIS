package com.lacomarcasoft.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
public class SecurityConfig {


    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {


        http
                .csrf(
                        csrf -> csrf.disable()
                )
                .cors(
                        cors -> {}
                )
                .authorizeHttpRequests(
                        auth -> auth

                                .requestMatchers(
                                        "/api/auth/**"
                                )
                                .permitAll()

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

        config.addAllowedMethod("*");

        config.addAllowedHeader("*");


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

}