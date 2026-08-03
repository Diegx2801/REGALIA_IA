package com.regalia.backend.builderIA.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.regalia.backend.builderIA.api.dto.BuilderIARecomendacionRequest;
import com.regalia.backend.builderIA.api.dto.BuilderIARecomendacionResponse;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.shared.exception.ServicioExternoNoDisponibleException;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuilderIAServiceTest {

    @Mock
    private BuilderIACandidatoService candidatoService;

    @Mock
    private BuilderIAProvider builderIAProvider;

    private BuilderIAService builderIAService;

    @BeforeEach
    void setUp() {
        builderIAService = new BuilderIAService(candidatoService, builderIAProvider, new ObjectMapper());
    }

    @Test
    void recomiendaSoloIdsCandidatosSinDuplicados() {
        ProductoEntity primero = producto(10L, 1L, "Ramo clasico");
        ProductoEntity segundo = producto(11L, 2L, "Box de chocolates");
        when(candidatoService.obtenerCandidatos(any())).thenReturn(List.of(primero, segundo));
        when(builderIAProvider.consultarRecomendaciones(any())).thenReturn("""
                {"mensaje":"Opciones para mama","productosRecomendados":[
                {"idProducto":11,"razon":"Es un detalle dulce"},
                {"idProducto":11,"razon":"Duplicado"},
                {"idProducto":999,"razon":"Inventado"}]}
                """);

        BuilderIARecomendacionResponse respuesta = builderIAService.recomendarProductos(
                new BuilderIARecomendacionRequest("Un regalo para mi mama")
        );

        assertThat(respuesta.productosRecomendados()).extracting(producto -> producto.idProducto())
                .containsExactly(11L);
        assertThat(respuesta.productosRecomendados().getFirst().razon())
                .isEqualTo("Es un detalle dulce");
    }

    @Test
    void usaFallbackDeterministaSiElProveedorFalla() {
        when(candidatoService.obtenerCandidatos(any())).thenReturn(List.of(
                producto(10L, 1L, "Ramo clasico"),
                producto(11L, 2L, "Box de chocolates"),
                producto(12L, 3L, "Peluche"),
                producto(13L, 4L, "Torta")
        ));
        when(builderIAProvider.consultarRecomendaciones(any()))
                .thenThrow(new ServicioExternoNoDisponibleException("Proveedor caido"));

        BuilderIARecomendacionResponse respuesta = builderIAService.recomendarProductos(
                new BuilderIARecomendacionRequest("Un regalo para mi mama")
        );

        assertThat(respuesta.productosRecomendados()).extracting(producto -> producto.idProducto())
                .containsExactly(10L, 11L, 12L);
        assertThat(respuesta.respuesta()).contains("opciones disponibles");
    }

    @Test
    void noInvocaLaIaSiNoHayCandidatos() {
        when(candidatoService.obtenerCandidatos(any())).thenReturn(List.of());

        BuilderIARecomendacionResponse respuesta = builderIAService.recomendarProductos(
                new BuilderIARecomendacionRequest("Un regalo")
        );

        assertThat(respuesta.productosRecomendados()).isEmpty();
        verify(builderIAProvider, never()).consultarRecomendaciones(any());
    }

    private ProductoEntity producto(Long id, Long idTipoProducto, String nombre) {
        TipoProductoEntity tipo = new TipoProductoEntity();
        tipo.setIdTipoProducto(idTipoProducto);
        tipo.setNombre("Categoria " + idTipoProducto);

        TiendaEntity tienda = new TiendaEntity();
        tienda.setIdTienda(7L);
        tienda.setNombre("Tienda demo");

        ProductoEntity producto = new ProductoEntity();
        producto.setIdProducto(id);
        producto.setNombre(nombre);
        producto.setDescripcion("Descripcion");
        producto.setPrecio(new BigDecimal("99.90"));
        producto.setStock(5);
        producto.setTienda(tienda);
        producto.setTipoProducto(tipo);
        return producto;
    }
}
