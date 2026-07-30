package com.regalia.backend.tiendaimagen.infrastructure.repository;

import com.regalia.backend.tiendaimagen.infrastructure.entity.TiendaImagenEntity;
import com.regalia.backend.tiendaimagen.infrastructure.entity.TipoImagenTienda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TiendaImagenJpaRepository extends JpaRepository<TiendaImagenEntity, Long> {

    Optional<TiendaImagenEntity> findByTiendaIdTiendaAndTipo(Long idTienda, TipoImagenTienda tipo);

    List<TiendaImagenEntity> findByTiendaIdTienda(Long idTienda);

    List<TiendaImagenEntity> findByTiendaIdTiendaIn(List<Long> idsTienda);
}
