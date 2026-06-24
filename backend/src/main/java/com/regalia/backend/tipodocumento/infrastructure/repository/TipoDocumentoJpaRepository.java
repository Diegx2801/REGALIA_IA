package com.regalia.backend.tipodocumento.infrastructure.repository;

import com.regalia.backend.tipodocumento.infrastructure.entity.TipoDocumentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tipo_documento.
 */
public interface TipoDocumentoJpaRepository extends JpaRepository<TipoDocumentoEntity, Long> {

    List<TipoDocumentoEntity> findByEstadoTrueOrderByIdTipoDocumentoAsc();

    List<TipoDocumentoEntity> findAllByOrderByIdTipoDocumentoAsc();

    Optional<TipoDocumentoEntity> findByIdTipoDocumentoAndEstadoTrue(Long idTipoDocumento);

    Optional<TipoDocumentoEntity> findByIdTipoDocumentoAndEstadoFalse(Long idTipoDocumento);

    Optional<TipoDocumentoEntity> findByAbreviaturaIgnoreCaseAndEstadoTrue(String abreviatura);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByAbreviaturaIgnoreCase(String abreviatura);

    boolean existsByNombreIgnoreCaseAndIdTipoDocumentoNot(String nombre, Long idTipoDocumento);

    boolean existsByAbreviaturaIgnoreCaseAndIdTipoDocumentoNot(String abreviatura, Long idTipoDocumento);
}
