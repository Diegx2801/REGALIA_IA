package com.regalia.backend.producto.application;

import com.regalia.backend.producto.api.dto.ProductoPublicoResponse;
import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import com.regalia.backend.producto.infrastructure.mapper.ProductoMapper;
import com.regalia.backend.producto.infrastructure.repository.ProductoJpaRepository;
import com.regalia.backend.productoimagen.infrastructure.entity.ProductoImagenEntity;
import com.regalia.backend.productoimagen.infrastructure.repository.ProductoImagenJpaRepository;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoConsultaServiceTest {

    @Mock
    private ProductoJpaRepository productoJpaRepository;

    @Mock
    private ProductoImagenJpaRepository productoImagenJpaRepository;

    @Mock
    private TiendaJpaRepository tiendaJpaRepository;

    @Mock
    private ProductoMapper productoMapper;

    @InjectMocks
    private ProductoConsultaService productoConsultaService;

    @Test
    void paginaProductosAplicandoFiltrosYRealizaUnaSolaConsultaDeImagenes() {
        ProductoEntity producto = new ProductoEntity();
        producto.setIdProducto(7L);

        ProductoImagenEntity imagen = new ProductoImagenEntity();
        imagen.setProducto(producto);
        imagen.setUrlImagen("/producto-7.png");
        imagen.setOrden(1);

        ProductoPublicoResponse.ImagenResumen imagenResumen =
                new ProductoPublicoResponse.ImagenResumen("/producto-7.png", 1);
        ProductoPublicoResponse response = new ProductoPublicoResponse(
                7L,
                2L,
                "Tienda REGALIA",
                3L,
                "Box",
                "Box especial",
                "Detalle",
                new BigDecimal("129.90"),
                5,
                List.of(imagenResumen)
        );
        PageRequest pageable = PageRequest.of(1, 12);

        when(productoJpaRepository.findPaginaProductosPublicosMarketplace(
                eq("APROBADA"),
                eq("box"),
                eq(3L),
                eq(new BigDecimal("150")),
                eq(true),
                eq(ProductoPublicoSortField.PRECIO),
                eq(Sort.Direction.DESC),
                eq(pageable)
        )).thenReturn(new PageImpl<>(List.of(producto), pageable, 25));
        when(productoImagenJpaRepository
                .findByProductoIdProductoInAndEstadoTrueOrderByProductoIdProductoAscOrdenAsc(
                        List.of(7L)
                ))
                .thenReturn(List.of(imagen));
        when(productoMapper.toPublicaImagenResumen(imagen)).thenReturn(imagenResumen);
        when(productoMapper.toPublicoResponse(producto, List.of(imagenResumen))).thenReturn(response);

        PaginaResponse<ProductoPublicoResponse> pagina = productoConsultaService
                .listarProductosPublicos(
                        " Bóx ",
                        3L,
                        new BigDecimal("150"),
                        true,
                        1,
                        12,
                        "precio,desc"
                );

        assertThat(pagina.contenido()).containsExactly(response);
        assertThat(pagina.paginaActual()).isEqualTo(1);
        assertThat(pagina.totalElementos()).isEqualTo(25);
        assertThat(pagina.totalPaginas()).isEqualTo(3);
        assertThat(pagina.ultimaPagina()).isFalse();
        verify(productoImagenJpaRepository)
                .findByProductoIdProductoInAndEstadoTrueOrderByProductoIdProductoAscOrdenAsc(
                        List.of(7L)
                );
    }

    @Test
    void evitaConsultarImagenesCuandoLaPaginaNoTieneProductos() {
        PageRequest pageable = PageRequest.of(0, 12);
        when(productoJpaRepository.findPaginaProductosPublicosMarketplace(
                "APROBADA",
                null,
                null,
                null,
                true,
                ProductoPublicoSortField.RECOMENDADO,
                Sort.Direction.ASC,
                pageable
        )).thenReturn(new PageImpl<>(List.of(), pageable, 0));

        PaginaResponse<ProductoPublicoResponse> pagina = productoConsultaService
                .listarProductosPublicos(null, null, null, true, 0, 12, null);

        assertThat(pagina.contenido()).isEmpty();
        assertThat(pagina.totalElementos()).isZero();
        verify(productoImagenJpaRepository, never())
                .findByProductoIdProductoInAndEstadoTrueOrderByProductoIdProductoAscOrdenAsc(any());
    }

    @Test
    void consultaDetallePublicoSoloMedianteLaBusquedaQueExigeImagenActiva() {
        TiendaEntity tienda = new TiendaEntity();
        tienda.setEstado(true);
        tienda.setEstadoRevision("APROBADA");

        ProductoEntity producto = new ProductoEntity();
        producto.setIdProducto(7L);
        producto.setTienda(tienda);

        ProductoImagenEntity imagen = new ProductoImagenEntity();
        imagen.setProducto(producto);
        imagen.setUrlImagen("/producto-7.png");
        imagen.setOrden(1);

        ProductoPublicoResponse.ImagenResumen imagenResumen =
                new ProductoPublicoResponse.ImagenResumen("/producto-7.png", 1);
        ProductoPublicoResponse response = new ProductoPublicoResponse(
                7L,
                2L,
                "Tienda REGALIA",
                3L,
                "Box",
                "Box especial",
                "Detalle",
                new BigDecimal("129.90"),
                5,
                List.of(imagenResumen)
        );

        when(productoJpaRepository.findProductoPublicoConImagenActiva(7L))
                .thenReturn(Optional.of(producto));
        when(productoImagenJpaRepository.findByProductoIdProductoAndEstadoTrueOrderByOrdenAsc(7L))
                .thenReturn(List.of(imagen));
        when(productoMapper.toPublicaImagenResumen(imagen)).thenReturn(imagenResumen);
        when(productoMapper.toPublicoResponse(producto, List.of(imagenResumen))).thenReturn(response);

        ProductoPublicoResponse detalle = productoConsultaService.obtenerProductoPublicoPorId(7L);

        assertThat(detalle).isEqualTo(response);
        verify(productoJpaRepository).findProductoPublicoConImagenActiva(7L);
    }

    @Test
    void rechazaParametrosQuePodrianGenerarConsultasNoControladas() {
        assertThatThrownBy(() -> productoConsultaService.listarProductosPublicos(
                null,
                null,
                null,
                true,
                0,
                100,
                "precio,asc"
        ))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("entre 1 y 50");

        assertThatThrownBy(() -> productoConsultaService.listarProductosPublicos(
                null,
                null,
                null,
                true,
                0,
                12,
                "nombre,asc"
        ))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("ordenamiento");

        verify(productoJpaRepository, never()).findPaginaProductosPublicosMarketplace(
                any(),
                any(),
                any(),
                any(),
                eq(true),
                any(),
                any(),
                any()
        );
    }
}
