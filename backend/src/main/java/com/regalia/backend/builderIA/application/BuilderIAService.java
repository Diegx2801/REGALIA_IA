package com.regalia.backend.builderIA.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.builderIA.api.dto.BuilderIAChatResponse;
import com.regalia.backend.builderIA.api.dto.BuilderIAProductoRecomendadoResponse;
import com.regalia.backend.builderIA.api.dto.BuilderIARecomendacionRequest;
import com.regalia.backend.builderIA.api.dto.BuilderIARecomendacionResponse;
import com.regalia.backend.builderIA.infrastructure.client.BuilderIAClient;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Servicio de aplicacion del builder IA.
 * Traduce la solicitud del cliente a un prompt y filtra la respuesta contra productos reales.
 */
@Service
@RequiredArgsConstructor
public class BuilderIAService {

    private static final String ESTADO_REVISION_APROBADA = "APROBADA";

    private final ProductoJpaRepository productoRepository;
    private final BuilderIAClient builderIAClient;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public BuilderIARecomendacionResponse recomendarProductos(BuilderIARecomendacionRequest request) {
        List<ProductoEntity> productos = productoRepository.findProductosPublicosMarketplace(ESTADO_REVISION_APROBADA);

        if (productos.isEmpty()) {
            return new BuilderIARecomendacionResponse(
                    "No hay productos visibles disponibles para recomendar en este momento.",
                    List.of()
            );
        }

        Map<String, ProductoEntity> productosPorNombre = indexarProductosPorNombre(productos);
        String inventarioJson = construirInventarioJson(productos);
        String prompt = construirPromptRecomendacion(request.busqueda(), inventarioJson);
        String textoIA = builderIAClient.consultarRecomendaciones(prompt);
        RespuestaRecomendacionIA respuestaIA = leerRespuestaRecomendacion(textoIA);

        List<BuilderIAProductoRecomendadoResponse> productosRecomendados = respuestaIA.productosRecomendados()
                .stream()
                .map(this::normalizarTexto)
                .distinct()
                .map(productosPorNombre::get)
                .filter(producto -> producto != null)
                .map(this::toProductoRecomendadoResponse)
                .toList();

        String mensaje = productosRecomendados.isEmpty()
                ? "No encontre productos relacionados con tu busqueda."
                : respuestaIA.mensaje();

        return new BuilderIARecomendacionResponse(mensaje, productosRecomendados);
    }

    public BuilderIAChatResponse responderChat(String pregunta) {
        String prompt = """
                Eres un asistente inteligente de REGALIA, un marketplace de regalos.
                Responde en espanol, claro y breve.
                Si la pregunta requiere comprar o reservar, orienta al usuario a buscar productos del catalogo.

                Pregunta del usuario:
                %s
                """.formatted(pregunta.trim());

        return new BuilderIAChatResponse(builderIAClient.consultarChat(prompt));
    }

    private String construirPromptRecomendacion(String busqueda, String inventarioJson) {
        return """
                Actúa como el recomendador inteligente de productos de REGALIA.

                El cliente busca:
                "%s"

                Productos disponibles del catálogo:
                %s

                Debes recomendar únicamente productos que existan en el catálogo.
                No inventes productos, tiendas, precios, stock ni información adicional.

                Interpreta la intención del cliente.
                No busques únicamente coincidencias exactas en el nombre del producto.

                Si el producto exacto no existe, recomienda productos del catálogo que satisfagan la misma necesidad, ocasión o intención de compra.

                Devuelve como máximo 3 productos ordenados del más recomendable al menos recomendable.

                Si la consulta no está relacionada con buscar o recomendar productos de REGALIA, responde:

                {
                "mensaje": "Solo puedo ayudar a recomendar productos disponibles en REGALIA.",
                "productosRecomendados": []
                }

                Responde SOLO en JSON válido, sin texto adicional.

                Usa exactamente esta estructura:

                {
                "mensaje": "Texto breve explicando la recomendación",
                "productosRecomendados": [
                    "Nombre exacto del producto"
                ]
                }

                Si no hay productos relacionados, responde:

                {
                "mensaje": "No encontré productos relacionados con tu búsqueda.",
                "productosRecomendados": []
                }
                """.formatted(busqueda.trim(), inventarioJson);
    }

    private String construirInventarioJson(List<ProductoEntity> productos) {
        List<ProductoInventarioIA> inventario = productos.stream()
                .map(producto -> new ProductoInventarioIA(
                        producto.getIdProducto(),
                        producto.getNombre(),
                        producto.getDescripcion(),
                        producto.getPrecio(),
                        producto.getStock(),
                        producto.getTienda().getNombre(),
                        producto.getTipoProducto().getNombre()
                ))
                .toList();

        try {
            return objectMapper.writeValueAsString(inventario);
        } catch (JsonProcessingException exception) {
            throw new ReglaNegocioException("No se pudo preparar el inventario para la IA");
        }
    }

    private RespuestaRecomendacionIA leerRespuestaRecomendacion(String textoIA) {
        if (textoIA.toLowerCase().contains("rate limit")) {
            throw new ReglaNegocioException(
                "La IA alcanzó el límite de uso. Intenta nuevamente en unos segundos."
            );
        }
        String json = limpiarJson(textoIA);
        json = json.replace("\\\"", "\"");
        try {
            RespuestaRecomendacionIA respuesta = objectMapper.readValue(json, RespuestaRecomendacionIA.class);
            List<String> productos = respuesta.productosRecomendados() == null
                    ? List.of()
                    : respuesta.productosRecomendados();

            return new RespuestaRecomendacionIA(
                    respuesta.mensaje() == null || respuesta.mensaje().isBlank()
                            ? "Estas son las recomendaciones encontradas."
                            : respuesta.mensaje().trim(),
                    productos
            );
        } catch (Exception exception) {
            throw new ReglaNegocioException("La IA devolvio una respuesta con formato invalido");
        }
    }

    private String limpiarJson(String textoIA) {
        if (textoIA == null || textoIA.isBlank()) {
            throw new ReglaNegocioException("La IA no devolvio recomendaciones");
        }

        String texto = textoIA.trim();

        if (texto.startsWith("```")) {
            texto = texto.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }

        int inicio = texto.indexOf('{');
        int fin = texto.lastIndexOf('}');

        if (inicio < 0 || fin < inicio) {
            throw new ReglaNegocioException("La IA no devolvio JSON valido");
        }

        return texto.substring(inicio, fin + 1);
    }

    private Map<String, ProductoEntity> indexarProductosPorNombre(List<ProductoEntity> productos) {
        Map<String, ProductoEntity> index = new LinkedHashMap<>();

        for (ProductoEntity producto : productos) {
            index.putIfAbsent(normalizarTexto(producto.getNombre()), producto);
        }

        return index;
    }

    private BuilderIAProductoRecomendadoResponse toProductoRecomendadoResponse(ProductoEntity producto) {
        return new BuilderIAProductoRecomendadoResponse(
                producto.getIdProducto(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getStock(),
                producto.getTienda().getIdTienda(),
                producto.getTienda().getNombre(),
                producto.getTipoProducto().getNombre()
        );
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return "";
        }

        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private record RespuestaRecomendacionIA(
            String mensaje,
            List<String> productosRecomendados
    ) {
    }

    private record ProductoInventarioIA(
            Long idProducto,
            String nombre,
            String descripcion,
            java.math.BigDecimal precio,
            Integer stock,
            String tienda,
            String tipoProducto
    ) {
    }
}
