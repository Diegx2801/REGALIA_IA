package com.regalia.backend.vendedor.infrastructure.repository;

import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla vendedor.
 */
public interface VendedorJpaRepository extends JpaRepository<VendedorEntity, Long> {

    Optional<VendedorEntity> findByUsuarioCorreoIgnoreCaseAndEstadoTrue(String correo);

    boolean existsByUsuarioIdUsuarioAndEstadoTrue(Long idUsuario);

    List<VendedorEntity> findAllByOrderByIdVendedorAsc();
}