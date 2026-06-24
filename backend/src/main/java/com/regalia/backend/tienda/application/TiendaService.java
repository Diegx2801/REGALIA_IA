package com.regalia.backend.tienda.application;

import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import com.regalia.backend.rubro.infrastructure.repository.RubroJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.tienda.api.dto.TiendaRequest;
import com.regalia.backend.tienda.api.dto.TiendaResponse;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tienda.infrastructure.mapper.TiendaMapper;
import com.regalia.backend.tienda.infrastructure.repository.TiendaJpaRepository;
import com.regalia.backend.tiendarubro.infrastructure.entity.TiendaRubroEntity;
import com.regalia.backend.tiendarubro.infrastructure.repository.TiendaRubroJpaRepository;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.usuariodocumento.infrastructure.repository.UsuarioDocumentoJpaRepository;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorJpaRepository;
import lombok.RequiredArgsConstructor;
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
    private final TiendaMapper tiendaMapper;

    @Transactional
    public TiendaResponse crearTienda(String correoUsuario, TiendaRequest request) {
        VendedorEntity vendedor = obtenerVendedorActivoPorCorreo(correoUsuario);

        validarLimiteTiendas(vendedor.getIdVendedor());

        UsuarioDocumentoEntity documentoFiscal = obtenerDocumentoFiscalValidoSiExiste(
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
    public List<TiendaResponse> listarTiendasAdministracion(String estadoRevision) {
        String estadoNormalizado = normalizarEstadoRevisionOpcional(estadoRevision);

        List<TiendaEntity> tiendas = estadoNormalizado == null
                ? tiendaRepository.findTiendasAdministracion()
                : tiendaRepository.findTiendasAdministracionPorEstado(estadoNormalizado);

        return tiendas
                .stream()
                .map(this::construirResponse)
                .toList();
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

        UsuarioDocumentoEntity documentoFiscal = obtenerDocumentoFiscalValidoSiExiste(
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

    private UsuarioDocumentoEntity obtenerDocumentoFiscalValidoSiExiste(Long idDocumentoFiscal, Long idUsuario) {
        if (idDocumentoFiscal == null) {
            return null;
        }

        UsuarioDocumentoEntity documentoFiscal = usuarioDocumentoRepository.findById(idDocumentoFiscal)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No se encontró el documento fiscal indicado"
                ));

        validarDocumentoFiscal(documentoFiscal, idUsuario);

        return documentoFiscal;
    }

    private void validarDocumentoFiscal(UsuarioDocumentoEntity documentoFiscal, Long idUsuario) {
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

        if (!ESTADO_DOCUMENTO_VERIFICADO.equalsIgnoreCase(documentoFiscal.getEstadoVerificacion())) {
            throw new RecursoNoEncontradoException(
                    "El documento fiscal indicado aún no está verificado"
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

        return tiendaMapper.toResponse(tienda, tiendaFormalizada, rubros);
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
