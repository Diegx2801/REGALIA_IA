package com.regalia.backend.usuariodocumento.application;

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

    private final ConsultaRucProvider consultaRucProvider;
    private final ConsultaRucPolicy consultaRucPolicy;
    private final ApisPeruRucProperties properties;
    private final ConcurrentMap<String, EntradaCache> cache = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, CompletableFuture<ConsultaRuc>> consultasEnCurso =
            new ConcurrentHashMap<>();

    public ConsultaRucService(
            ConsultaRucProvider consultaRucProvider,
            ConsultaRucPolicy consultaRucPolicy,
            ApisPeruRucProperties properties
    ) {
        this.consultaRucProvider = consultaRucProvider;
        this.consultaRucPolicy = consultaRucPolicy;
        this.properties = properties;
    }

    public ConsultaRuc consultar(String numeroRuc) {
        EntradaCache entrada = obtenerEntradaVigente(numeroRuc);
        if (entrada != null) {
            return entrada.respuesta();
        }

        CompletableFuture<ConsultaRuc> nuevaConsulta = new CompletableFuture<>();
        CompletableFuture<ConsultaRuc> consultaExistente = consultasEnCurso.putIfAbsent(
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
            ConsultaRuc respuesta = consultaRucProvider.consultar(numeroRuc);
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

    private void guardarEnCache(String numeroRuc, ConsultaRuc respuesta) {
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

    private ConsultaRuc esperarConsulta(CompletableFuture<ConsultaRuc> consulta) {
        try {
            return consulta.join();
        } catch (CompletionException exception) {
            if (exception.getCause() instanceof RuntimeException runtimeException) {
                throw runtimeException;
            }
            throw exception;
        }
    }

    private record EntradaCache(ConsultaRuc respuesta, Instant expiraEn) {
    }
}
