package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.tipodocumento.infrastructure.repository.TipoDocumentoJpaRepository;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariodocumento.api.dto.AdminUsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoRequest;
import com.regalia.backend.usuariodocumento.api.dto.UsuarioDocumentoResponse;
import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import com.regalia.backend.usuariodocumento.infrastructure.mapper.UsuarioDocumentoMapper;
import com.regalia.backend.usuariodocumento.infrastructure.repository.UsuarioDocumentoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para gestionar solicitudes de verificación de documentos.
 */
@Service
@RequiredArgsConstructor
public class UsuarioDocumentoService {

    private final UsuarioDocumentoJpaRepository usuarioDocumentoRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final TipoDocumentoJpaRepository tipoDocumentoRepository;
    private final UsuarioDocumentoMapper usuarioDocumentoMapper;

    @Transactional(readOnly = true)
    public List<UsuarioDocumentoResponse> listarMisDocumentos(String correoUsuario) {
        return usuarioDocumentoRepository.findByUsuarioCorreoIgnoreCaseAndEstadoTrueOrderByIdUsuarioDocumentoAsc(correoUsuario)
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

    @Transactional(readOnly = true)
    public List<AdminUsuarioDocumentoResponse> listarDocumentosParaRevision(String estadoVerificacion) {
        List<UsuarioDocumentoEntity> documentos;

        if (estadoVerificacion == null || estadoVerificacion.isBlank()) {
            documentos = usuarioDocumentoRepository.findAllByOrderByIdUsuarioDocumentoAsc();
        } else {
            String estadoNormalizado = normalizarEstadoVerificacion(estadoVerificacion);
            documentos = usuarioDocumentoRepository
                    .findByEstadoVerificacionIgnoreCaseOrderByIdUsuarioDocumentoAsc(estadoNormalizado);
        }

        return documentos.stream()
                .map(usuarioDocumentoMapper::toAdminResponse)
                .toList();
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

        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.save(documento);

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

        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.save(documento);

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

        UsuarioDocumentoEntity documentoGuardado = usuarioDocumentoRepository.save(documento);

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
}