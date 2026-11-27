package com.lacomarcasoft.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {
    private static final String ACCESO_IDENTIFICACION =
        "hasAuthority('CONTROL_INGRESO') and (" +
        "hasAnyRole('DOCENTE', 'AUXILIAR', 'PERSONAL DE INGRESO') " +
        "or !hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
        "'AUXILIAR', 'PERSONAL DE INGRESO'))";

    private static final String ACCESO_INSCRIPCION_QR_DOCENTE =
        "hasRole('DOCENTE') or (" +
        "hasAuthority('GESTIONAR_MATERIAS') and " +
        "!hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
        "'AUXILIAR', 'PERSONAL DE INGRESO'))";
        
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(
                    (request, response, authException) -> {
                        response.setStatus(
                            HttpStatus.UNAUTHORIZED.value()
                        );
                        response.setContentType(
                            "application/json;charset=UTF-8"
                        );
                        response.getWriter().write(
                            "{\"message\":\"Debe iniciar sesion o renovar su sesion\"}"
                        );
                    }
                )
                .accessDeniedHandler(
                    (request, response, accessDeniedException) -> {
                        response.setStatus(
                            HttpStatus.FORBIDDEN.value()
                        );
                        response.setContentType(
                            "application/json;charset=UTF-8"
                        );
                        response.getWriter().write(
                            "{\"message\":\"No tiene permisos para realizar esta operacion\"}"
                        );
                    }
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/login",
                    "/api/auth/recuperacion/**",
                    "/actuator/health"
                ).permitAll()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/perfil/me"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/perfil/me/telefono"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/perfil/me/documento"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/perfil/me/contrasena"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/perfil/me/foto"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/perfil/me/foto"
                ).authenticated()

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/ingresos/examenes/*/identificar-documento",
                    "/api/ingresos/examenes/identificar-documento",
                    "/api/ingresos/examenes/identificar-documento/*/foto",
                    "/api/ingresos/examenes/identificar-documento/*/estudiantes/*/habilitacion",
                    "/api/ingresos/examenes/identificar-documento/examenes"
                )
                .access(new WebExpressionAuthorizationManager(
                    ACCESO_IDENTIFICACION
                ))
                
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/ingresos/examenes/pendientes",
                    "/api/ingresos/examenes/pendientes/*/estudiantes/*"
                )
                .hasAuthority("GENERAR_REPORTES")

                .requestMatchers(
                      HttpMethod.GET,
                      "/api/ingresos/examenes/registrados/resumen",
                      "/api/ingresos/examenes/registrados/resumen/listado",
                      "/api/ingresos/examenes/registrados"
                )
                .hasAuthority("GENERAR_REPORTES")


                .requestMatchers(
                    HttpMethod.GET,
                      "/api/ingresos/examenes/registrados/*"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GENERAR_REPORTES') " +
                    "or (hasRole('DOCENTE') and hasAuthority('CONTROL_INGRESO'))"
                ))

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/ingresos/examenes/disponibles"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GENERAR_REPORTES') or (" +
                    ACCESO_IDENTIFICACION +
                    ")"
                ))

                .requestMatchers(
                    "/api/ingresos/examenes/intentos-no-autorizados",
                    "/api/ingresos/examenes/intentos-no-autorizados/**"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasRole('DOCENTE') and hasAuthority('CONTROL_INGRESO')"
                ))

                .requestMatchers("/api/ingresos/examenes/**")
                .access(new WebExpressionAuthorizationManager(
                    ACCESO_IDENTIFICACION
                ))

                .requestMatchers(
                    "/api/situaciones-excepcionales",
                    "/api/situaciones-excepcionales/**"
                ).hasRole("ADMINISTRADOR")

                .requestMatchers("/api/logs/**")
                .hasAuthority("VER_AUDITORIA")

                .requestMatchers(
                    "/api/reportes",
                    "/api/reportes/**"
                )
                .hasAuthority("GENERAR_REPORTES")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/usuarios/importar",
                    "/api/usuarios/importar/analizar",
                    "/api/usuarios/detectar-duplicados"
                )
                .hasAuthority("IMPORTAR_USUARIOS")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/usuarios/verificar-codigo-sis"
                )
                .hasAuthority("REGISTRAR_USUARIOS")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/usuarios"
                )
                .hasAuthority("REGISTRAR_USUARIOS")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/usuarios/materias"
                )
                .hasAnyAuthority(
                    "REGISTRAR_USUARIOS",
                    "GESTIONAR_USUARIOS",
                    "GESTIONAR_EXAMENES"
                )

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/usuarios",
                    "/api/usuarios/paginado",
                    "/api/usuarios/*"
                )
                .hasAuthority("GESTIONAR_USUARIOS")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/usuarios/*"
                )
                .hasAuthority("GESTIONAR_USUARIOS")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/roles"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAnyAuthority('GESTIONAR_ROLES', 'REGISTRAR_USUARIOS')"
                ))

                .requestMatchers(
                    "/api/roles",
                    "/api/roles/**",
                    "/api/permisos",
                    "/api/permisos/**"
                )
                .hasAuthority("GESTIONAR_ROLES")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/asignaturas",
                    "/api/asignaturas/"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GESTIONAR_MATERIAS') and (" +
                    "hasRole('ADMINISTRADOR') or " +
                    "!hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
                    "'AUXILIAR', 'PERSONAL DE INGRESO'))"
                ))

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/asignaturas",
                    "/api/asignaturas/",
                    "/api/asignaturas/**"
                )
                .hasAuthority("GESTIONAR_MATERIAS")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscripciones-qr/materias/docente",
                    "/api/inscripciones-qr/materias/*/activo",
                    "/api/inscripciones-qr/materias/*/estudiantes"
                )
                .access(new WebExpressionAuthorizationManager(
                    ACCESO_INSCRIPCION_QR_DOCENTE
                ))

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscripciones-qr/materias/*/generar",
                    "/api/inscripciones-qr/materias/*/renovar"
                )
                .access(new WebExpressionAuthorizationManager(
                    ACCESO_INSCRIPCION_QR_DOCENTE
                ))

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/inscripciones-qr/materias/*/desactivar"
                )
                .access(new WebExpressionAuthorizationManager(
                    ACCESO_INSCRIPCION_QR_DOCENTE
                ))

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inscripciones-qr/materias/estudiante"
                ).hasRole("ESTUDIANTE")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscripciones-qr/validar"
                ).hasRole("ESTUDIANTE")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inscripciones-qr/inscribir"
                ).hasRole("ESTUDIANTE")

                .requestMatchers(
                    HttpMethod.POST,
                    "/api/habilitaciones/motivos"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GESTIONAR_HABILITACIONES') and (" +
                    "hasRole('ADMINISTRADOR') or " +
                    "!hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
                    "'AUXILIAR', 'PERSONAL DE INGRESO'))"
                ))

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/habilitaciones/motivos/*"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GESTIONAR_HABILITACIONES') and (" +
                    "hasRole('ADMINISTRADOR') or " +
                    "!hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
                    "'AUXILIAR', 'PERSONAL DE INGRESO'))"
                ))

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/habilitaciones/motivos/*/estado"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GESTIONAR_HABILITACIONES') and (" +
                    "hasRole('ADMINISTRADOR') or " +
                    "!hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
                    "'AUXILIAR', 'PERSONAL DE INGRESO'))"
                ))

                .requestMatchers(
                    "/api/habilitaciones/examenes/**"
                )
                .access(new WebExpressionAuthorizationManager(
                    "hasAuthority('GESTIONAR_HABILITACIONES') and (" +
                    "hasRole('DOCENTE') or " +
                    "!hasAnyRole('ADMINISTRADOR', 'DOCENTE', 'ESTUDIANTE', " +
                    "'AUXILIAR', 'PERSONAL DE INGRESO'))"
                ))

                .requestMatchers(
                    "/api/habilitaciones/**"
                )
                .hasAuthority("GESTIONAR_HABILITACIONES")

                .requestMatchers(
                    HttpMethod.GET,
                    "/api/estudiante/examenes"
                ).hasRole("ESTUDIANTE")

                .requestMatchers(
                    "/api/examenes",
                    "/api/examenes/**"
                ).hasAuthority("GESTIONAR_EXAMENES")

                .requestMatchers(
                    "/api/expulsiones",
                    "/api/expulsiones/**"
                ).hasRole("ADMINISTRADOR")

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

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
