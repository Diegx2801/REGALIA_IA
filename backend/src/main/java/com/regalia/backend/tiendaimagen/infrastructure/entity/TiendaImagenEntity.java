package com.regalia.backend.tiendaimagen.infrastructure.entity;

import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Referencia persistente de un recurso visual de identidad comercial. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tienda_imagen")
public class TiendaImagenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tienda_imagen")
    private Long idTiendaImagen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tienda", nullable = false)
    private TiendaEntity tienda;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoImagenTienda tipo;

    @Column(name = "url_imagen", nullable = false, length = 500)
    private String urlImagen;

    @Column(name = "clave_almacenamiento", nullable = false, length = 500)
    private String claveAlmacenamiento;

    @Column(name = "tipo_contenido", nullable = false, length = 100)
    private String tipoContenido;

    @Column(name = "ancho", nullable = false)
    private Integer ancho;

    @Column(name = "alto", nullable = false)
    private Integer alto;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    public TiendaImagenEntity(
            TiendaEntity tienda,
            TipoImagenTienda tipo,
            String urlImagen,
            String claveAlmacenamiento,
            String tipoContenido,
            Integer ancho,
            Integer alto
    ) {
        this.tienda = tienda;
        this.tipo = tipo;
        this.urlImagen = urlImagen;
        this.claveAlmacenamiento = claveAlmacenamiento;
        this.tipoContenido = tipoContenido;
        this.ancho = ancho;
        this.alto = alto;
    }

    @PrePersist
    void prePersist() {
        fechaCreacion = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
