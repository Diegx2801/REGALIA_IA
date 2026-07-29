package com.regalia.backend.usuariodocumento.infrastructure.repository;

import com.regalia.backend.usuariodocumento.infrastructure.entity.UsuarioDocumentoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("""
            SELECT ud
            FROM UsuarioDocumentoEntity ud
            JOIN ud.usuario usuario
            JOIN ud.tipoDocumento tipoDocumento
            WHERE (:estadoVerificacion IS NULL OR UPPER(ud.estadoVerificacion) = UPPER(:estadoVerificacion))
              AND (
                    :busqueda IS NULL OR :busqueda = ''
                    OR (:campoBusqueda = 'TODOS' AND (
                        LOWER(CONCAT(usuario.nombre, ' ', usuario.apellido)) LIKE LOWER(CONCAT('%', :busqueda, '%'))
                        OR LOWER(usuario.correo) LIKE LOWER(CONCAT('%', :busqueda, '%'))
                        OR LOWER(ud.numeroDocumento) LIKE LOWER(CONCAT('%', :busqueda, '%'))
                        OR LOWER(tipoDocumento.abreviatura) LIKE LOWER(CONCAT('%', :busqueda, '%'))
                    ))
                    OR (:campoBusqueda = 'NOMBRE' AND LOWER(CONCAT(usuario.nombre, ' ', usuario.apellido)) LIKE LOWER(CONCAT('%', :busqueda, '%')))
                    OR (:campoBusqueda = 'CORREO' AND LOWER(usuario.correo) LIKE LOWER(CONCAT('%', :busqueda, '%')))
                    OR (:campoBusqueda = 'DOCUMENTO' AND LOWER(ud.numeroDocumento) LIKE LOWER(CONCAT('%', :busqueda, '%')))
              )
            """)
    Page<UsuarioDocumentoEntity> buscarParaRevision(
            @Param("estadoVerificacion") String estadoVerificacion,
            @Param("campoBusqueda") String campoBusqueda,
            @Param("busqueda") String busqueda,
            Pageable pageable
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
