
package com.lacomarcasoft.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/recuperacion/**",
                    "/actuator/health"
                ).permitAll()

                .requestMatchers("/api/logs/**")
                .hasRole("ADMINISTRADOR")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/asignaturas",
                    "/api/asignaturas/"
                ).hasRole("ADMINISTRADOR")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscripciones-qr/materias/docente"
                ).hasRole("DOCENTE")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscripciones-qr/materias/*/generar"
                ).hasRole("DOCENTE")
                
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscripciones-qr/materias/*/activo"
                ).hasRole("DOCENTE")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscripciones-qr/inscribir"
                ).hasRole("ESTUDIANTE")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/habilitaciones/motivos"
                ).hasRole("ADMINISTRADOR")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/habilitaciones/motivos/*"
                ).hasRole("ADMINISTRADOR")

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/habilitaciones/motivos/*/estado"
                ).hasRole("ADMINISTRADOR")

                .requestMatchers(
                    "/api/habilitaciones/examenes/**"
                ).hasRole("DOCENTE")

                .requestMatchers(
                    "/api/habilitaciones/**"
                ).hasAnyRole("DOCENTE", "ADMINISTRADOR")

                .requestMatchers(
                    "/api/examenes",
                    "/api/examenes/**"
                ).hasAuthority("GESTIONAR_EXAMENES")

                .anyRequest().authenticated()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(
            List.of(allowedOrigins.split("\\s*,\\s*"))
        );

        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}