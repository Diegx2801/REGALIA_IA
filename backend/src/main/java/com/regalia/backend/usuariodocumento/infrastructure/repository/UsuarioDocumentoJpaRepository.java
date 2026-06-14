package com.regalia.backend.usuariodocumento.infrastructure.repository;

import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla usuario_documento.
 */
public interface UsuarioDocumentoJpaRepository extends JpaRepository<UsuarioDocumentoEntity, Long> {

    List<UsuarioDocumentoEntity> findByUsuarioCorreoIgnoreCaseAndEstadoTrueOrderByIdUsuarioDocumentoAsc(String correo);

    boolean existsByUsuarioIdUsuarioAndTipoDocumentoIdTipoDocumentoAndEstadoTrue(
            Long idUsuario,
            Long idTipoDocumento
    );

    List<UsuarioDocumentoEntity> findAllByOrderByIdUsuarioDocumentoAsc();

    List<UsuarioDocumentoEntity> findByEstadoVerificacionIgnoreCaseOrderByIdUsuarioDocumentoAsc(
            String estadoVerificacion
    );

    Optional<UsuarioDocumentoEntity> findByIdUsuarioDocumentoAndEstadoTrue(Long idUsuarioDocumento);

    boolean existsByTipoDocumentoIdTipoDocumentoAndNumeroDocumentoIgnoreCaseAndEstadoVerificacionAndEstadoTrueAndIdUsuarioDocumentoNot(
            Long idTipoDocumento,
            String numeroDocumento,
            String estadoVerificacion,
            Long idUsuarioDocumento
    );
}