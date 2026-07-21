package com.regalia.backend.builderIA.application;

import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tipoproducto.infrastructure.entity.TipoProductoEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BuilderIACandidatoServiceTest {

    @Mock
    private ProductoJpaRepository productoRepository;

    @Test
    void extraePresupuestoYLimitaDiversificandoCandidatos() {
        List<ProductoEntity> pool = new ArrayList<>();
        for (long id = 1; id <= 12; id++) {
            pool.add(producto(id, id <= 8 ? 1L : 2L, id == 1 ? "Flores para mama" : "Producto " + id));
        }
        when(productoRepository.findCandidatosPublicosBuilderIA(
                eq("APROBADA"), anyList(), eq(new BigDecimal("150")), anyInt()
        )).thenReturn(pool);

        BuilderIACandidatoService service = new BuilderIACandidatoService(productoRepository);
        List<ProductoEntity> candidatos = service.obtenerCandidatos(
                "Quiero flores para mi mama hasta 150 soles"
        );

        assertThat(candidatos).hasSize(12);
        assertThat(candidatos.getFirst().getIdProducto()).isEqualTo(1L);
        assertThat(candidatos.subList(0, 9))
                .filteredOn(producto -> producto.getTipoProducto().getIdTipoProducto().equals(2L))
                .isNotEmpty();

        org.mockito.Mockito.verify(productoRepository).findCandidatosPublicosBuilderIA(
                eq("APROBADA"),
                argThat(terminos -> terminos.contains("flores")
                        && terminos.contains("mama")
                        && !terminos.contains("regalo")
                        && !terminos.contains("soles")
                        && !terminos.contains("150")),
                eq(new BigDecimal("150")),
                eq(80)
        );
    }

    @Test
    void usaCatalogoAcotadoCuandoNoHayCoincidenciasLexicas() {
        when(productoRepository.findCandidatosPublicosBuilderIA(
                eq("APROBADA"), anyList(), any(), eq(80)
        )).thenReturn(List.of(), List.of(producto(5L, 1L, "Detalle disponible")));

        BuilderIACandidatoService service = new BuilderIACandidatoService(productoRepository);
        List<ProductoEntity> candidatos = service.obtenerCandidatos("Sorpresa para mama");

        assertThat(candidatos).extracting(ProductoEntity::getIdProducto).containsExactly(5L);
    }

    private ProductoEntity producto(Long id, Long categoria, String nombre) {
        TipoProductoEntity tipo = new TipoProductoEntity();
        tipo.setIdTipoProducto(categoria);
        tipo.setNombre("Categoria " + categoria);
        TiendaEntity tienda = new TiendaEntity();
        tienda.setIdTienda(categoria);
        tienda.setNombre("Tienda " + categoria);
        ProductoEntity producto = new ProductoEntity();
        producto.setIdProducto(id);
        producto.setNombre(nombre);
        producto.setDescripcion("Regalo especial");
        producto.setPrecio(new BigDecimal("100"));
        producto.setStock(3);
        producto.setTipoProducto(tipo);
        producto.setTienda(tienda);
        return producto;
    }
}
