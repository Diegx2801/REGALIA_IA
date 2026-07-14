package com.regalia.backend.usuariodocumento.infrastructure.repository;

import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla usuario_documento.
 */
public interface UsuarioDocumentoJpaRepository extends JpaRepository<UsuarioDocumentoEntity, Long> {

    List<UsuarioDocumentoEntity> findByUsuarioCorreoIgnoreCaseAndEstadoTrueOrderByIdUsuarioDocumentoAsc(String correo);
    
    List<UsuarioDocumentoEntity> findByUsuarioCorreoIgnoreCaseOrderByIdUsuarioDocumentoAsc(String correo);

    boolean existsByUsuarioIdUsuarioAndTipoDocumentoIdTipoDocumentoAndEstadoTrue(
            Long idUsuario,
            Long idTipoDocumento
    );

    List<UsuarioDocumentoEntity> findAllByOrderByIdUsuarioDocumentoAsc();

    List<UsuarioDocumentoEntity> findByEstadoVerificacionIgnoreCaseOrderByIdUsuarioDocumentoAsc(
            String estadoVerificacion
    );

    Optional<UsuarioDocumentoEntity> findByIdUsuarioDocumentoAndEstadoTrue(Long idUsuarioDocumento);

    Optional<UsuarioDocumentoEntity> findByTipoDocumentoIdTipoDocumentoAndNumeroDocumentoIgnoreCase(
            Long idTipoDocumento,
            String numeroDocumento
    );

    boolean existsByTipoDocumentoIdTipoDocumentoAndNumeroDocumentoIgnoreCaseAndEstadoVerificacionAndEstadoTrueAndIdUsuarioDocumentoNot(
            Long idTipoDocumento,
            String numeroDocumento,
            String estadoVerificacion,
            Long idUsuarioDocumento
    );

    @Query("""
            SELECT CASE WHEN COUNT(ud) > 0 THEN true ELSE false END
            FROM UsuarioDocumentoEntity ud
            WHERE ud.usuario.idUsuario = :idUsuario
              AND ud.estado = true
              AND UPPER(ud.estadoVerificacion) = UPPER(:estadoVerificacion)
              AND ud.tipoDocumento.estado = true
              AND ud.tipoDocumento.categoriaDocumento.estado = true
              AND UPPER(ud.tipoDocumento.categoriaDocumento.nombre) = UPPER(:categoriaDocumento)
            """)
    boolean existsDocumentoVerificadoPorCategoria(
            @Param("idUsuario") Long idUsuario,
            @Param("estadoVerificacion") String estadoVerificacion,
            @Param("categoriaDocumento") String categoriaDocumento
    );
}
