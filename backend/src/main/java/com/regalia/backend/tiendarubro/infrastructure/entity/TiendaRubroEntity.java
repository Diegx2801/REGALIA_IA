package com.regalia.backend.tiendarubro.infrastructure.entity;

import com.regalia.backend.rubro.infrastructure.entity.RubroEntity;
import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidad JPA que representa la relación muchos a muchos entre tienda y rubro.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tienda_rubro")
public class TiendaRubroEntity {

    @EmbeddedId
    private TiendaRubroId id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("idTienda")
    @JoinColumn(name = "id_tienda", nullable = false)
    private TiendaEntity tienda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("idRubro")
    @JoinColumn(name = "id_rubro", nullable = false)
    private RubroEntity rubro;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    public TiendaRubroEntity(TiendaEntity tienda, RubroEntity rubro) {
        this.tienda = tienda;
        this.rubro = rubro;
        this.id = new TiendaRubroId(tienda.getIdTienda(), rubro.getIdRubro());
        this.estado = true;
    }

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}