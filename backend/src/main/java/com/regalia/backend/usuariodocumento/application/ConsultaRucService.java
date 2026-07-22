package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.usuariodocumento.api.dto.ConsultaRucResponse;
import com.regalia.backend.usuariodocumento.infrastructure.client.ApisPeruRucClient;
import com.regalia.backend.usuariodocumento.infrastructure.client.ApisPeruRucProperties;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/** Centraliza el cache y la cuota antes de consultar el proveedor RUC. */
@Service
public class ConsultaRucService {

    private final ApisPeruRucClient apisPeruRucClient;
    private final ConsultaRucPolicy consultaRucPolicy;
    private final ApisPeruRucProperties properties;
    private final ConcurrentMap<String, EntradaCache> cache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, CompletableFuture<ConsultaRucResponse>> consultasEnCurso =
            new ConcurrentHashMap<>();

    public ConsultaRucService(
            ApisPeruRucClient apisPeruRucClient,
            ConsultaRucPolicy consultaRucPolicy,
            ApisPeruRucProperties properties
    ) {
        this.apisPeruRucClient = apisPeruRucClient;
        this.consultaRucPolicy = consultaRucPolicy;
        this.properties = properties;
    }

    public ConsultaRucResponse consultar(String numeroRuc) {
        EntradaCache entrada = obtenerEntradaVigente(numeroRuc);
        if (entrada != null) {
            return entrada.respuesta();
        }

        CompletableFuture<ConsultaRucResponse> nuevaConsulta = new CompletableFuture<>();
        CompletableFuture<ConsultaRucResponse> consultaExistente = consultasEnCurso.putIfAbsent(
                numeroRuc,
                nuevaConsulta
        );

        if (consultaExistente != null) {
            return esperarConsulta(consultaExistente);
        }

        try {
            EntradaCache entradaActualizada = obtenerEntradaVigente(numeroRuc);
            if (entradaActualizada != null) {
                nuevaConsulta.complete(entradaActualizada.respuesta());
                return entradaActualizada.respuesta();
            }

            consultaRucPolicy.registrarConsultaPermitida();
            ConsultaRucResponse respuesta = apisPeruRucClient.consultar(numeroRuc);
            guardarEnCache(numeroRuc, respuesta);
            nuevaConsulta.complete(respuesta);
            return respuesta;
        } catch (RuntimeException exception) {
            nuevaConsulta.completeExceptionally(exception);
            throw exception;
        } finally {
            consultasEnCurso.remove(numeroRuc, nuevaConsulta);
        }
    }

    private EntradaCache obtenerEntradaVigente(String numeroRuc) {
        EntradaCache entrada = cache.get(numeroRuc);
        if (entrada == null) {
            return null;
        }

        if (entrada.expiraEn().isAfter(Instant.now())) {
            return entrada;
        }

        cache.remove(numeroRuc, entrada);
        return null;
    }

    private void guardarEnCache(String numeroRuc, ConsultaRucResponse respuesta) {
        int maximoEntradas = Math.max(1, properties.getCacheMaxEntries());
        if (cache.size() >= maximoEntradas) {
            cache.entrySet()
                    .stream()
                    .min(Comparator.comparing(entry -> entry.getValue().expiraEn()))
                    .map(Map.Entry::getKey)
                    .ifPresent(cache::remove);
        }

        cache.put(
                numeroRuc,
                new EntradaCache(
                        respuesta,
                        Instant.now().plus(properties.getCacheTtl())
                )
        );
    }

    private ConsultaRucResponse esperarConsulta(CompletableFuture<ConsultaRucResponse> consulta) {
        try {
            return consulta.join();
        } catch (CompletionException exception) {
            if (exception.getCause() instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw exception;
        }
    }

    private record EntradaCache(ConsultaRucResponse respuesta, Instant expiraEn) {
    }
}
