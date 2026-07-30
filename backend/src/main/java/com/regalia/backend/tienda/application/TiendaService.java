package com.regalia.backend.tienda.application;

import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import com.regalia.backend.rubro.infrastructure.repository.RubroJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.tienda.api.dto.TiendaRequest;
import com.regalia.backend.tienda.api.dto.TiendaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.mapper.TiendaMapper;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TiendaImagenEntity;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TipoImagenTienda;
import com.regalia.backend.tiendaimagen.infrastructure.repository.TiendaImagenJpaRepository;
import com.regalia.backend.tiendarubro.infrastructure.entity.TiendaRubroEntity;
import com.regalia.backend.tiendarubro.infrastructure.repository.TiendaRubroJpaRepository;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.usuariodocumento.infrastructure.repository.UsuarioDocumentoJpaRepository;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Servicio de aplicación para gestionar tiendas de vendedores.
 */
@Service
@RequiredArgsConstructor
public class TiendaService {

    private static final int LIMITE_TIENDAS_PLAN_ACTUAL = 1;
    private static final int DEFAULT_ADMIN_PAGE = 0;
    private static final int DEFAULT_ADMIN_PAGE_SIZE = 10;
    private static final int MAX_ADMIN_PAGE_SIZE = 50;

    private static final String ESTADO_REVISION_PENDIENTE = "PENDIENTE";
    private static final String ESTADO_REVISION_APROBADA = "APROBADA";
    private static final String ESTADO_REVISION_OBSERVADA = "OBSERVADA";
    private static final String ESTADO_REVISION_RECHAZADA = "RECHAZADA";

    private static final String ESTADO_DOCUMENTO_VERIFICADO = "VERIFICADO";
    private static final String CATEGORIA_FISCAL = "FISCAL";

    private final TiendaJpaRepository tiendaRepository;
    private final VendedorJpaRepository vendedorRepository;
    private final UsuarioDocumentoJpaRepository usuarioDocumentoRepository;
    private final RubroJpaRepository rubroRepository;
    private final TiendaRubroJpaRepository tiendaRubroRepository;
    private final TiendaImagenJpaRepository tiendaImagenRepository;
    private final TiendaMapper tiendaMapper;

    @Transactional
    public TiendaResponse crearTienda(String correoUsuario, TiendaRequest request) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);

        validarLimiteTiendas(vendedor.getIdVendedor());

        UsuarioDocumentoEntity documentoFiscal = obtenerDocumentoFiscalActivoSiExiste(
                request.idDocumentoFiscal(),
                vendedor.getUsuario().getIdUsuario()
        );

        TiendaEntity tienda = tiendaMapper.toEntity(request, vendedor, documentoFiscal);
        TiendaEntity tiendaGuardada = tiendaRepository.save(tienda);

        asignarRubros(tiendaGuardada, request.idsRubros());

        return construirResponse(tiendaGuardada);
    }

    @Transactional(readOnly = true)
    public List<TiendaResponse> listarMisTiendas(String correoUsuario) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);

        return tiendaRepository.findByVendedorIdVendedorAndEstadoTrueOrderByIdTiendaAsc(vendedor.getIdVendedor())
                .stream()
                .map(this::construirResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginaResponse<TiendaResponse> listarTiendasAdministracion(
            String estadoRevision,
            String searchField,
            String search,
            Integer page,
            Integer size,
            String sort
    ) {
        String estadoNormalizado = normalizarEstadoRevisionOpcional(estadoRevision);
        TiendaSearchField campoBusqueda = TiendaSearchField.desde(searchField);
        TiendaAdminSortField sortField = TiendaAdminSortField.desde(sort);
        Sort.Direction sortDirection = TiendaAdminSortField.direccionDesde(sort);
        String busqueda = normalizarBusqueda(search);
        Long busquedaId = obtenerBusquedaIdSiAplica(campoBusqueda, busqueda);
        int pagina = normalizarPagina(page);
        int tamanioPagina = normalizarTamanioPagina(size);
        Pageable pageable = PageRequest.of(
                pagina,
                tamanioPagina,
                Sort.by(sortDirection, sortField.apiName())
        );

        Page<TiendaResponse> tiendas = tiendaRepository.findTiendasAdministracion(
                        estadoNormalizado,
                        campoBusqueda,
                        busqueda,
                        busquedaId,
                        sortField,
                        sortDirection,
                        pageable
                )
                .map(this::construirResponse);

        return new PaginaResponse<>(
                tiendas.getContent(),
                tiendas.getNumber(),
                tiendas.getSize(),
                tiendas.getTotalElements(),
                tiendas.getTotalPages(),
                tiendas.isLast()
        );
    }

    @Transactional(readOnly = true)
    public TiendaResponse obtenerMiTiendaPorId(String correoUsuario, Long idTienda) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaPorId(idTienda);

        validarPropiedadTienda(tienda, vendedor.getIdVendedor());

        return construirResponse(tienda);
    }

    @Transactional(readOnly = true)
    public TiendaResponse obtenerTiendaAdministracionPorId(Long idTienda) {
        TiendaEntity tienda = obtenerTiendaActivaPorId(idTienda);

        return construirResponse(tienda);
    }

    @Transactional
    public TiendaResponse actualizarTienda(String correoUsuario, Long idTienda, TiendaRequest request) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaPorId(idTienda);

        validarPropiedadTienda(tienda, vendedor.getIdVendedor());

        UsuarioDocumentoEntity documentoFiscal = obtenerDocumentoFiscalActivoSiExiste(
                request.idDocumentoFiscal(),
                vendedor.getUsuario().getIdUsuario()
        );

        tiendaMapper.actualizarEntity(tienda, request, documentoFiscal);

        TiendaEntity tiendaActualizada = tiendaRepository.saveAndFlush(tienda);

        if (request.idsRubros() != null) {
            reemplazarRubros(tiendaActualizada, request.idsRubros());
        }

        return construirResponse(tiendaActualizada);
    }

    @Transactional
    public TiendaResponse marcarTiendaPendiente(Long idTienda) {
        return cambiarEstadoRevisionAdministracion(
                idTienda,
                ESTADO_REVISION_PENDIENTE,
                "La tienda ya se encuentra pendiente de revisión"
        );
    }

    @Transactional
    public TiendaResponse aprobarTienda(Long idTienda) {
        return cambiarEstadoRevisionAdministracion(
                idTienda,
                ESTADO_REVISION_APROBADA,
                "La tienda ya se encuentra aprobada"
        );
    }

    @Transactional
    public TiendaResponse observarTienda(Long idTienda) {
        return cambiarEstadoRevisionAdministracion(
                idTienda,
                ESTADO_REVISION_OBSERVADA,
                "La tienda ya se encuentra observada"
        );
    }

    @Transactional
    public TiendaResponse rechazarTienda(Long idTienda) {
        return cambiarEstadoRevisionAdministracion(
                idTienda,
                ESTADO_REVISION_RECHAZADA,
                "La tienda ya se encuentra rechazada"
        );
    }

    @Transactional
    public void eliminarTienda(String correoUsuario, Long idTienda) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);
        TiendaEntity tienda = obtenerTiendaActivaPorId(idTienda);

        validarPropiedadTienda(tienda, vendedor.getIdVendedor());

        tienda.setEstado(false);
        tiendaRepository.save(tienda);

        List<TiendaRubroEntity> relaciones = tiendaRubroRepository.findByTiendaIdTienda(tienda.getIdTienda());

        relaciones.forEach(relacion -> relacion.setEstado(false));

        tiendaRubroRepository.saveAll(relaciones);
    }

    private TiendaResponse cambiarEstadoRevisionAdministracion(
            Long idTienda,
            String nuevoEstado,
            String mensajeEstadoActual
    ) {
        TiendaEntity tienda = obtenerTiendaActivaPorId(idTienda);

        if (nuevoEstado.equalsIgnoreCase(tienda.getEstadoRevision())) {
            throw new ReglaNegocioException(mensajeEstadoActual);
        }

        tienda.setEstadoRevision(nuevoEstado);

        TiendaEntity tiendaActualizada = tiendaRepository.saveAndFlush(tienda);

        return construirResponse(tiendaActualizada);
    }

    private VendedorEntity obtenerVendedorActivoPorCorreo(String correoUsuario) {
        return vendedorRepository.findByUsuarioCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró un perfil vendedor activo para el usuario autenticado"
                ));
    }

    private TiendaEntity obtenerTiendaActivaPorId(Long idTienda) {
        return tiendaRepository.findByIdTiendaAndEstadoTrue(idTienda)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró la tienda solicitada"
                ));
    }

    private void validarLimiteTiendas(Long idVendedor) {
        long tiendasActivas = tiendaRepository.countByVendedorIdVendedorAndEstadoTrue(idVendedor);

        if (tiendasActivas >= LIMITE_TIENDAS_PLAN_ACTUAL) {
            throw new RecursoDuplicadoException("Tu plan actual solo permite una tienda activa");
        }
    }

    private void validarPropiedadTienda(TiendaEntity tienda, Long idVendedor) {
        if (!Objects.equals(tienda.getVendedor().getIdVendedor(), idVendedor)) {
            throw new RecursoNoEncontradoException(
                    "No se encontró la tienda solicitada para el vendedor autenticado"
            );
        }
    }

    private String normalizarEstadoRevisionOpcional(String estadoRevision) {
        if (estadoRevision == null || estadoRevision.isBlank()) {
            return null;
        }

        String estadoNormalizado = estadoRevision.trim().toUpperCase();

        if (!ESTADO_REVISION_PENDIENTE.equals(estadoNormalizado)
                && !ESTADO_REVISION_APROBADA.equals(estadoNormalizado)
                && !ESTADO_REVISION_OBSERVADA.equals(estadoNormalizado)
                && !ESTADO_REVISION_RECHAZADA.equals(estadoNormalizado)) {
            throw new ReglaNegocioException("El estado de revisión indicado no es válido");
        }

        return estadoNormalizado;
    }

    private String normalizarBusqueda(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }

    private Long obtenerBusquedaIdSiAplica(TiendaSearchField campoBusqueda, String busqueda) {
        if (busqueda == null || campoBusqueda != TiendaSearchField.ID_TIENDA) {
            return null;
        }

        try {
            return Long.valueOf(busqueda);
        } catch (NumberFormatException exception) {
            throw new ReglaNegocioException("El ID de tienda debe ser numerico");
        }
    }

    private int normalizarPagina(Integer page) {
        if (page == null) {
            return DEFAULT_ADMIN_PAGE;
        }

        if (page < 0) {
            throw new ReglaNegocioException("La pagina no puede ser negativa");
        }

        return page;
    }

    private int normalizarTamanioPagina(Integer size) {
        if (size == null) {
            return DEFAULT_ADMIN_PAGE_SIZE;
        }

        if (size < 1) {
            throw new ReglaNegocioException("El tamanio de pagina debe ser mayor a cero");
        }

        if (size > MAX_ADMIN_PAGE_SIZE) {
            throw new ReglaNegocioException("El tamanio maximo permitido por pagina es 50");
        }

        return size;
    }

    private UsuarioDocumentoEntity obtenerDocumentoFiscalActivoSiExiste(Long idDocumentoFiscal, Long idUsuario) {
        if (idDocumentoFiscal == null) {
            return null;
        }

        UsuarioDocumentoEntity documentoFiscal = usuarioDocumentoRepository.findById(idDocumentoFiscal)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el documento fiscal indicado"
                ));

        validarDocumentoFiscalActivo(documentoFiscal, idUsuario);

        return documentoFiscal;
    }

    private void validarDocumentoFiscalActivo(UsuarioDocumentoEntity documentoFiscal, Long idUsuario) {
        if (!Objects.equals(documentoFiscal.getUsuario().getIdUsuario(), idUsuario)) {
            throw new RecursoNoEncontradoException(
                    "El documento fiscal indicado no pertenece al usuario autenticado"
            );
        }

        if (!Boolean.TRUE.equals(documentoFiscal.getEstado())) {
            throw new RecursoNoEncontradoException(
                    "El documento fiscal indicado no está activo"
            );
        }

        if (documentoFiscal.getTipoDocumento() == null
                || documentoFiscal.getTipoDocumento().getCategoriaDocumento() == null
                || !CATEGORIA_FISCAL.equalsIgnoreCase(
                        documentoFiscal.getTipoDocumento().getCategoriaDocumento().getNombre()
                )) {
            throw new RecursoNoEncontradoException(
                    "El documento indicado no pertenece a la categoría fiscal"
            );
        }
    }

    private List<RubroEntity> obtenerRubrosActivos(List<Long> idsRubros) {
        if (idsRubros == null || idsRubros.isEmpty()) {
            return List.of();
        }

        List<Long> idsUnicos = idsRubros.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (idsUnicos.isEmpty()) {
            return List.of();
        }

        List<RubroEntity> rubros = rubroRepository.findByIdRubroInAndEstadoTrue(idsUnicos);

        if (rubros.size() != idsUnicos.size()) {
            throw new RecursoNoEncontradoException(
                    "Uno o más rubros no existen o no están activos"
            );
        }

        return rubros;
    }

    private void asignarRubros(TiendaEntity tienda, List<Long> idsRubros) {
        List<RubroEntity> rubros = obtenerRubrosActivos(idsRubros);

        List<TiendaRubroEntity> relaciones = rubros.stream()
                .map(rubro -> new TiendaRubroEntity(tienda, rubro))
                .toList();

        tiendaRubroRepository.saveAll(relaciones);
    }

    private void reemplazarRubros(TiendaEntity tienda, List<Long> idsRubros) {
        List<RubroEntity> rubros = obtenerRubrosActivos(idsRubros);

        List<TiendaRubroEntity> relacionesExistentes = tiendaRubroRepository
                .findByTiendaIdTienda(tienda.getIdTienda());

        relacionesExistentes.forEach(relacion -> relacion.setEstado(false));

        Map<Long, TiendaRubroEntity> relacionesPorRubro = relacionesExistentes.stream()
                .collect(Collectors.toMap(
                        relacion -> relacion.getRubro().getIdRubro(),
                        Function.identity(),
                        (primera, segunda) -> primera
                ));

        List<TiendaRubroEntity> relacionesFinales = new ArrayList<>(relacionesExistentes);

        for (RubroEntity rubro : rubros) {
            TiendaRubroEntity relacion = relacionesPorRubro.get(rubro.getIdRubro());

            if (relacion != null) {
                relacion.setEstado(true);
            } else {
                relacionesFinales.add(new TiendaRubroEntity(tienda, rubro));
            }
        }

        tiendaRubroRepository.saveAll(relacionesFinales);
    }

    private TiendaResponse construirResponse(TiendaEntity tienda) {
        List<TiendaResponse.RubroResumen> rubros = tiendaRubroRepository
                .findByTiendaIdTiendaAndEstadoTrueOrderByRubroNombreAsc(tienda.getIdTienda())
                .stream()
                .map(relacion -> new TiendaResponse.RubroResumen(
                        relacion.getRubro().getIdRubro(),
                        relacion.getRubro().getNombre()
                ))
                .toList();

        Boolean tiendaFormalizada = calcularTiendaFormalizada(tienda);
        Map<TipoImagenTienda, String> imagenes = urlsImagenes(tienda.getIdTienda());

        return tiendaMapper.toResponse(
                tienda,
                tiendaFormalizada,
                imagenes.get(TipoImagenTienda.LOGO),
                imagenes.get(TipoImagenTienda.PORTADA),
                rubros
        );
    }

    private Map<TipoImagenTienda, String> urlsImagenes(Long idTienda) {
        return tiendaImagenRepository.findByTiendaIdTienda(idTienda)
                .stream()
                .collect(Collectors.toMap(
                        TiendaImagenEntity::getTipo,
                        TiendaImagenEntity::getUrlImagen
                ));
    }

    private Boolean calcularTiendaFormalizada(TiendaEntity tienda) {
        UsuarioDocumentoEntity documentoFiscal = tienda.getDocumentoFiscal();

        if (documentoFiscal == null) {
            return false;
        }

        return Boolean.TRUE.equals(documentoFiscal.getEstado())
                && ESTADO_DOCUMENTO_VERIFICADO.equalsIgnoreCase(documentoFiscal.getEstadoVerificacion())
                && documentoFiscal.getTipoDocumento() != null
                && documentoFiscal.getTipoDocumento().getCategoriaDocumento() != null
                && CATEGORIA_FISCAL.equalsIgnoreCase(
                        documentoFiscal.getTipoDocumento().getCategoriaDocumento().getNombre()
                );
    }
}
