package com.regalia.backend.tiendarubro.infrastructure.repository;

import com.regalia.backend.tiendarubro.infrastructure.entity.TiendaRubroEntity;
import com.regalia.backend.tiendarubro.infrastructure.entity.TiendaRubroId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para operaciones sobre la tabla tienda_rubro.
 */
public interface TiendaRubroJpaRepository extends JpaRepository<TiendaRubroEntity, TiendaRubroId> {

    List<TiendaRubroEntity> findByTiendaIdTienda(Long idTienda);

    List<TiendaRubroEntity> findByTiendaIdTiendaAndEstadoTrueOrderByRubroNombreAsc(Long idTienda);

    Optional<TiendaRubroEntity> findByTiendaIdTiendaAndRubroIdRubro(Long idTienda, Long idRubro);
}