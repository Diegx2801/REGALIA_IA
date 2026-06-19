package com.regalia.backend.categoriadocumento.infrastructure.repository;

import com.regalia.backend.categoriadocumento.infrastructure.entity.CategoriaDocumentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla categoria_documento.
 */
public interface CategoriaDocumentoJpaRepository extends JpaRepository<CategoriaDocumentoEntity, Long> {

    List<CategoriaDocumentoEntity> findByEstadoTrueOrderByIdCategoriaDocumentoAsc();

    Optional<CategoriaDocumentoEntity> findByNombreIgnoreCaseAndEstadoTrue(String nombre);
}