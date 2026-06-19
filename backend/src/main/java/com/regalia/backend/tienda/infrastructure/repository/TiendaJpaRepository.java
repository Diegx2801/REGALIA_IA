package com.regalia.backend.tienda.infrastructure.repository;

import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tienda.
 */
public interface TiendaJpaRepository extends JpaRepository<TiendaEntity, Long> {

    List<TiendaEntity> findByVendedorIdVendedorAndEstadoTrueOrderByIdTiendaAsc(Long idVendedor);

    List<TiendaEntity> findByEstadoTrueAndEstadoRevisionNotOrderByIdTiendaAsc(String estadoRevision);

    Optional<TiendaEntity> findByIdTiendaAndEstadoTrue(Long idTienda);

    Optional<TiendaEntity> findByIdTiendaAndEstadoTrueAndEstadoRevisionNot(Long idTienda, String estadoRevision);

    long countByVendedorIdVendedorAndEstadoTrue(Long idVendedor);

    long countByVendedorIdVendedor(Long idVendedor);
}