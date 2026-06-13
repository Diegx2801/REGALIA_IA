package com.regalia.backend.usuariodocumento.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import com.regalia.backend.tipodocumento.infrastructure.repository.TipoDocumentoJpaRepository;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
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
 * Servicio de aplicación para gestionar documentos registrados por usuarios.
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

    private UsuarioEntity obtenerUsuarioActivoPorCorreo(String correoUsuario) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario autenticado"));
    }

    private TipoDocumentoEntity obtenerTipoDocumentoActivoPorId(Long idTipoDocumento) {
        return tipoDocumentoRepository.findById(idTipoDocumento)
                .filter(TipoDocumentoEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("El tipo de documento seleccionado no está disponible"));
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
}