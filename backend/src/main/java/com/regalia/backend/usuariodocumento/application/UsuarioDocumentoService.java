package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.tipodocumento.infrastructure.repository.TipoDocumentoJpaRepository;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariodocumento.api.dto.AdminUsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.api.dto.ConsultaRucResponse;
import com.regalia.backend.usuariodocumento.api.dto.RegistrarRucRequest;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoRequest;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.usuariodocumento.infrastructure.mapper.UsuarioDocumentoMapper;
import com.regalia.backend.usuariodocumento.infrastructure.repository.UsuarioDocumentoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

/**
 * Servicio de aplicación para gestionar solicitudes de verificación de documentos.
 */
@Service
@RequiredArgsConstructor
public class UsuarioDocumentoService {

    private static final int TAMANIO_PAGINA_MAXIMO = 50;
    private static final Set<String> CAMPOS_BUSQUEDA_ADMINISTRATIVA = Set.of(
            "TODOS", "NOMBRE", "CORREO", "DOCUMENTO"
    );
    private static final Set<String> CAMPOS_ORDEN_ADMINISTRATIVO = Set.of(
            "idUsuarioDocumento", "fechaCreacion", "estadoVerificacion", "numeroDocumento"
    );

    private final UsuarioDocumentoJpaRepository usuarioDocumentoRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final TipoDocumentoJpaRepository tipoDocumentoRepository;
    private final UsuarioDocumentoMapper usuarioDocumentoMapper;
    private final ConsultaRucService consultaRucService;

    @Transactional(readOnly = true)
    public List<UsuarioDocumentoResponse> listarMisDocumentos(String correoUsuario) {
        return usuarioDocumentoRepository.findByUsuarioCorreoIgnoreCaseOrderByIdUsuarioDocumentoAsc(correoUsuario)
                .stream()
                .map(usuarioDocumentoMapper::toResponse)
                .toList();
    }

    @Transactional
    public UsuarioDocumentoResponse registrarDocumento(String correoUsuario, UsuarioDocumentoRequest request) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);
        TipoDocumentoEntity tipoDocumento = obtenerTipoDocumentoActivoPorId(request.idTipoDocumento());

        String numeroDocumentoNormalizado = usuarioDocumentoMapper.normalizarDocumento(request.numeroDocumento());

        validarLongitudDocumento(tipoDocumento, numeroDocumentoNormalizado);
        validarTipoDocumentoDuplicadoParaUsuario(usuario.getIdUsuario(), tipoDocumento.getIdTipoDocumento());

        UsuarioDocumentoEntity documento = usuarioDocumentoMapper.toEntity(request, usuario, tipoDocumento);
        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.save(documento);

        return usuarioDocumentoMapper.toResponse(documentoGuardado);
    }

    /**
     * Consulta un RUC sin persistirlo para que el vendedor confirme sus datos tributarios.
     */
    @Transactional(readOnly = true)
    public ConsultaRucResponse consultarRuc(String numeroRuc) {
        return toConsultaRucResponse(consultaRucService.consultar(normalizarRuc(numeroRuc)));
    }

    /**
     * Registra el RUC validado como pendiente de revision administrativa.
     * La consulta externa valida el dato, pero no reemplaza la decision del administrador.
     */
    @Transactional
    public UsuarioDocumentoResponse registrarRucPendiente(String correoUsuario, RegistrarRucRequest request) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);
        String numeroRuc = normalizarRuc(request.numeroRuc());
        ConsultaRuc consulta = consultaRucService.consultar(numeroRuc);

        if (!numeroRuc.equals(consulta.ruc())) {
            throw new ReglaNegocioException("La respuesta del servicio no corresponde al RUC consultado");
        }

        TipoDocumentoEntity tipoRuc = tipoDocumentoRepository.findByAbreviaturaIgnoreCaseAndEstadoTrue("RUC")
                .orElseThrow(() -> new RecursoNoEncontradoException("El tipo de documento RUC no esta disponible"));

        return usuarioDocumentoRepository
                .findByTipoDocumentoIdTipoDocumentoAndNumeroDocumentoIgnoreCase(
                        tipoRuc.getIdTipoDocumento(),
                        numeroRuc
                )
                .map(documento -> resolverDocumentoRucExistente(documento, usuario))
                .orElseGet(() -> crearDocumentoRucPendiente(usuario, tipoRuc, numeroRuc));
    }

    @Transactional(readOnly = true)
    public PaginaResponse<AdminUsuarioDocumentoResponse> listarDocumentosParaRevision(
            String estadoVerificacion,
            String campoBusqueda,
            String busqueda,
            Integer pagina,
            Integer tamanio,
            String orden
    ) {
        String estadoNormalizado = estadoVerificacion == null || estadoVerificacion.isBlank()
                ? null
                : normalizarEstadoVerificacion(estadoVerificacion);
        String campoNormalizado = normalizarCampoBusquedaAdministrativa(campoBusqueda);
        String busquedaNormalizada = busqueda == null ? "" : busqueda.trim();
        Pageable pageable = crearPaginacionAdministrativa(pagina, tamanio, orden);

        Page<UsuarioDocumentoEntity> documentos = usuarioDocumentoRepository.buscarParaRevision(
                estadoNormalizado,
                campoNormalizado,
                busquedaNormalizada,
                pageable
        );

        return new PaginaResponse<>(
                documentos.getContent().stream().map(usuarioDocumentoMapper::toAdminResponse).toList(),
                documentos.getNumber(),
                documentos.getSize(),
                documentos.getTotalElements(),
                documentos.getTotalPages(),
                documentos.isLast()
        );
    }

    @Transactional(readOnly = true)
    public AdminUsuarioDocumentoResponse obtenerDocumentoParaRevision(Long idUsuarioDocumento) {
        UsuarioDocumentoEntity documento = obtenerSolicitudPorId(idUsuarioDocumento);

        return usuarioDocumentoMapper.toAdminResponse(documento);
    }

    @Transactional
    public AdminUsuarioDocumentoResponse verificarDocumento(Long idUsuarioDocumento) {
        UsuarioDocumentoEntity documento = obtenerSolicitudPorId(idUsuarioDocumento);

        if ("VERIFICADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("La solicitud ya se encuentra verificada");
        }

        if ("RECHAZADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("No se puede verificar una solicitud rechazada");
        }

        if (!Boolean.TRUE.equals(documento.getEstado())) {
            throw new ReglaNegocioException("No se puede verificar una solicitud inactiva");
        }

        validarDocumentoNoVerificadoPorOtroUsuario(documento);

        documento.setEstadoVerificacion("VERIFICADO");

        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.saveAndFlush(documento);

        return usuarioDocumentoMapper.toAdminResponse(documentoGuardado);
    }

    @Transactional
    public AdminUsuarioDocumentoResponse observarDocumento(Long idUsuarioDocumento) {
        UsuarioDocumentoEntity documento = obtenerSolicitudPorId(idUsuarioDocumento);

        if ("VERIFICADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("No se puede observar una solicitud que ya fue verificada");
        }

        if ("RECHAZADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("No se puede observar una solicitud rechazada");
        }

        if (!Boolean.TRUE.equals(documento.getEstado())) {
            throw new ReglaNegocioException("No se puede observar una solicitud inactiva");
        }

        if ("OBSERVADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("La solicitud ya se encuentra observada");
        }

        documento.setEstadoVerificacion("OBSERVADO");

        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.saveAndFlush(documento);

        return usuarioDocumentoMapper.toAdminResponse(documentoGuardado);
    }

    @Transactional
    public AdminUsuarioDocumentoResponse rechazarDocumento(Long idUsuarioDocumento) {
        UsuarioDocumentoEntity documento = obtenerSolicitudPorId(idUsuarioDocumento);

        if ("VERIFICADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("No se puede rechazar una solicitud que ya fue verificada");
        }

        if ("RECHAZADO".equals(documento.getEstadoVerificacion())) {
            throw new ReglaNegocioException("La solicitud ya se encuentra rechazada");
        }

        documento.setEstadoVerificacion("RECHAZADO");
        documento.setEstado(false);

        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.saveAndFlush(documento);

        return usuarioDocumentoMapper.toAdminResponse(documentoGuardado);
    }

    private UsuarioEntity obtenerUsuarioActivoPorCorreo(String correoUsuario) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario autenticado"));
    }

    private TipoDocumentoEntity obtenerTipoDocumentoActivoPorId(Long idTipoDocumento) {
        return tipoDocumentoRepository.findById(idTipoDocumento)
                .filter(TipoDocumentoEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("El tipo de documento seleccionado no está disponible"));
    }

    private UsuarioDocumentoEntity obtenerSolicitudPorId(Long idUsuarioDocumento) {
        return usuarioDocumentoRepository.findById(idUsuarioDocumento)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró la solicitud de verificación con ID: " + idUsuarioDocumento));
    }

    private void validarLongitudDocumento(TipoDocumentoEntity tipoDocumento, String numeroDocumento) {
        int longitud = numeroDocumento.length();

        if (longitud < tipoDocumento.getLongitudMinima() || longitud > tipoDocumento.getLongitudMaxima()) {
            throw new ReglaNegocioException(
                    "El número de documento debe tener entre "
                            + tipoDocumento.getLongitudMinima()
                            + " y "
                            + tipoDocumento.getLongitudMaxima()
                            + " caracteres"
            );
        }
    }

    private void validarTipoDocumentoDuplicadoParaUsuario(Long idUsuario, Long idTipoDocumento) {
        if (usuarioDocumentoRepository.existsByUsuarioIdUsuarioAndTipoDocumentoIdTipoDocumentoAndEstadoTrue(idUsuario, idTipoDocumento)) {
            throw new RecursoDuplicadoException("Ya tienes una solicitud activa de verificación para este tipo de documento");
        }
    }

    private void validarDocumentoNoVerificadoPorOtroUsuario(UsuarioDocumentoEntity documento) {
        boolean existeDocumentoVerificado = usuarioDocumentoRepository
                .existsByTipoDocumentoIdTipoDocumentoAndNumeroDocumentoIgnoreCaseAndEstadoVerificacionAndEstadoTrueAndIdUsuarioDocumentoNot(
                        documento.getTipoDocumento().getIdTipoDocumento(),
                        documento.getNumeroDocumento(),
                        "VERIFICADO",
                        documento.getIdUsuarioDocumento()
                );

        if (existeDocumentoVerificado) {
            throw new RecursoDuplicadoException("No se puede verificar este documento porque ya existe una cuenta verificada con el mismo número de documento");
        }
    }

    private UsuarioDocumentoResponse resolverDocumentoRucExistente(
            UsuarioDocumentoEntity documento,
            UsuarioEntity usuario
    ) {
        if (!documento.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new RecursoDuplicadoException("El RUC indicado ya esta registrado en otra cuenta");
        }

        if (!Boolean.TRUE.equals(documento.getEstado())) {
            throw new ReglaNegocioException("El RUC indicado se encuentra inactivo y no puede reutilizarse");
        }

        return usuarioDocumentoMapper.toResponse(documento);
    }

    private UsuarioDocumentoResponse crearDocumentoRucPendiente(
            UsuarioEntity usuario,
            TipoDocumentoEntity tipoRuc,
            String numeroRuc
    ) {
        UsuarioDocumentoEntity documento = new UsuarioDocumentoEntity();
        documento.setUsuario(usuario);
        documento.setTipoDocumento(tipoRuc);
        documento.setNumeroDocumento(numeroRuc);
        documento.setEstadoVerificacion("PENDIENTE");
        documento.setEstado(true);

        return usuarioDocumentoMapper.toResponse(usuarioDocumentoRepository.save(documento));
    }

    private String normalizarRuc(String numeroRuc) {
        String ruc = usuarioDocumentoMapper.normalizarDocumento(numeroRuc);

        if (!ruc.matches("\\d{11}")) {
            throw new ReglaNegocioException("El RUC debe tener exactamente 11 digitos");
        }

        return ruc;
    }

    private ConsultaRucResponse toConsultaRucResponse(ConsultaRuc consulta) {
        return new ConsultaRucResponse(
                consulta.ruc(),
                consulta.razonSocial(),
                consulta.nombreComercial(),
                consulta.estado(),
                consulta.condicion(),
                consulta.direccion(),
                consulta.departamento(),
                consulta.provincia(),
                consulta.distrito()
        );
    }

    private String normalizarEstadoVerificacion(String estadoVerificacion) {
        String estadoNormalizado = estadoVerificacion.trim().toUpperCase();

        if (!estadoNormalizado.equals("PENDIENTE")
                && !estadoNormalizado.equals("VERIFICADO")
                && !estadoNormalizado.equals("OBSERVADO")
                && !estadoNormalizado.equals("RECHAZADO")) {
            throw new ReglaNegocioException("El estado de verificación indicado no es válido");
        }

        return estadoNormalizado;
    }

    private String normalizarCampoBusquedaAdministrativa(String campoBusqueda) {
        String campoNormalizado = campoBusqueda == null || campoBusqueda.isBlank()
                ? "TODOS"
                : campoBusqueda.trim().toUpperCase();

        if (!CAMPOS_BUSQUEDA_ADMINISTRATIVA.contains(campoNormalizado)) {
            throw new ReglaNegocioException("El campo de busqueda documental no es valido");
        }

        return campoNormalizado;
    }

    private Pageable crearPaginacionAdministrativa(Integer pagina, Integer tamanio, String orden) {
        int paginaNormalizada = pagina == null ? 0 : pagina;
        int tamanioNormalizado = tamanio == null ? 10 : tamanio;

        if (paginaNormalizada < 0) {
            throw new ReglaNegocioException("La pagina no puede ser negativa");
        }
        if (tamanioNormalizado < 1 || tamanioNormalizado > TAMANIO_PAGINA_MAXIMO) {
            throw new ReglaNegocioException("El tamanio maximo permitido por pagina es " + TAMANIO_PAGINA_MAXIMO);
        }

        String[] partesOrden = (orden == null || orden.isBlank() ? "fechaCreacion,desc" : orden)
                .split(",", 2);
        String campo = partesOrden[0].trim();
        Sort.Direction direccion = partesOrden.length == 2 && "asc".equalsIgnoreCase(partesOrden[1].trim())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        if (!CAMPOS_ORDEN_ADMINISTRATIVO.contains(campo)) {
            throw new ReglaNegocioException("El campo de ordenamiento documental no es valido");
        }

        return PageRequest.of(paginaNormalizada, tamanioNormalizado, Sort.by(direccion, campo));
    }
}
