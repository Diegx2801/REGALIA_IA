package com.regalia.backend.builderIA.application;

import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Recupera, puntua y diversifica candidatos reales antes de invocar a la IA. */
@Service
@RequiredArgsConstructor
public class BuilderIACandidatoService {

    private static final String ESTADO_REVISION_APROBADA = "APROBADA";
    private static final int MAX_POOL = 80;
    private static final int MAX_CANDIDATOS = 20;
    private static final int MAX_POR_CATEGORIA_PRIMERA_PASADA = 5;
    private static final Set<String> TERMINOS_IGNORADOS = Set.of(
            "quiero", "regalo", "regalos", "para", "pueda", "puedo", "ofrecerle", "darle",
            "algo", "una", "uno", "unos", "unas", "que", "con", "por", "del", "las", "los",
            "mi", "mis", "su", "sus", "como", "esta", "este", "sol", "soles", "hasta",
            "maximo", "presupuesto"
    );
    private static final Pattern PATRON_PRESUPUESTO = Pattern.compile(
            "(?i)(?:s/\\.?|soles?|hasta|maximo|máximo|presupuesto(?:\\s+de)?)\\s*(\\d+(?:[.,]\\d{1,2})?)|"
                    + "(\\d+(?:[.,]\\d{1,2})?)\\s*(?:soles?|s/\\.?)"
    );

    private final ProductoJpaRepository productoRepository;

    @Transactional(readOnly = true)
    public List<ProductoEntity> obtenerCandidatos(String busqueda) {
        String consultaNormalizada = normalizarTexto(busqueda);
        List<String> terminos = extraerTerminos(consultaNormalizada);
        BigDecimal presupuesto = extraerPresupuesto(busqueda);

        List<ProductoEntity> coincidencias = terminos.isEmpty()
                ? List.of()
                : productoRepository.findCandidatosPublicosBuilderIA(
                        ESTADO_REVISION_APROBADA,
                        terminos,
                        presupuesto,
                        MAX_POOL
                );
        List<ProductoEntity> generales = coincidencias.size() >= MAX_CANDIDATOS
                ? List.of()
                : productoRepository.findCandidatosPublicosBuilderIA(
                        ESTADO_REVISION_APROBADA,
                        List.of(),
                        presupuesto,
                        MAX_POOL
                );

        Map<Long, ProductoEntity> pool = new LinkedHashMap<>();
        coincidencias.forEach(producto -> pool.putIfAbsent(producto.getIdProducto(), producto));
        generales.forEach(producto -> pool.putIfAbsent(producto.getIdProducto(), producto));

        List<ProductoEntity> ordenados = pool.values().stream()
                .sorted(Comparator
                        .comparingInt((ProductoEntity producto) -> puntuar(producto, terminos, presupuesto))
                        .reversed()
                        .thenComparing(ProductoEntity::getIdProducto))
                .toList();

        return diversificar(ordenados);
    }

    private List<ProductoEntity> diversificar(List<ProductoEntity> ordenados) {
        List<ProductoEntity> resultado = new ArrayList<>();
        Map<Long, Integer> cantidadPorCategoria = new LinkedHashMap<>();

        for (ProductoEntity producto : ordenados) {
            Long categoria = producto.getTipoProducto().getIdTipoProducto();
            int cantidad = cantidadPorCategoria.getOrDefault(categoria, 0);
            if (cantidad < MAX_POR_CATEGORIA_PRIMERA_PASADA) {
                resultado.add(producto);
                cantidadPorCategoria.put(categoria, cantidad + 1);
            }
            if (resultado.size() == MAX_CANDIDATOS) {
                return List.copyOf(resultado);
            }
        }

        Set<Long> idsIncluidos = resultado.stream()
                .map(ProductoEntity::getIdProducto)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
        for (ProductoEntity producto : ordenados) {
            if (idsIncluidos.add(producto.getIdProducto())) {
                resultado.add(producto);
            }
            if (resultado.size() == MAX_CANDIDATOS) {
                break;
            }
        }
        return List.copyOf(resultado);
    }

    private int puntuar(ProductoEntity producto, List<String> terminos, BigDecimal presupuesto) {
        String nombre = normalizarTexto(producto.getNombre());
        String descripcion = normalizarTexto(producto.getDescripcion());
        String categoria = normalizarTexto(producto.getTipoProducto().getNombre());
        String tienda = normalizarTexto(producto.getTienda().getNombre());
        int puntaje = 0;

        for (String termino : terminos) {
            if (nombre.contains(termino)) puntaje += 5;
            if (categoria.contains(termino)) puntaje += 4;
            if (descripcion.contains(termino)) puntaje += 2;
            if (tienda.contains(termino)) puntaje += 1;
        }
        if (presupuesto != null && producto.getPrecio().compareTo(presupuesto) <= 0) {
            puntaje += 2;
        }
        return puntaje;
    }

    private List<String> extraerTerminos(String consulta) {
        return Arrays.stream(consulta.split("[^a-z0-9]+"))
                .filter(termino -> termino.length() >= 3)
                .filter(termino -> !termino.matches("\\d+"))
                .filter(termino -> !TERMINOS_IGNORADOS.contains(termino))
                .distinct()
                .limit(8)
                .toList();
    }

    private BigDecimal extraerPresupuesto(String busqueda) {
        Matcher matcher = PATRON_PRESUPUESTO.matcher(busqueda == null ? "" : busqueda);
        if (!matcher.find()) {
            return null;
        }
        String valor = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
        try {
            return new BigDecimal(valor.replace(',', '.'));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String normalizarTexto(String valor) {
        if (valor == null) return "";
        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
