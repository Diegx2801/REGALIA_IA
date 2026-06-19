package com.regalia.backend.productoimagen.infrastructure.entity;

import com.regalia.backend.producto.infrastructure.entity.ProductoEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entidad JPA que representa la tabla producto_imagen.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "producto_imagen")
public class ProductoImagenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_producto_imagen")
    private Long idProductoImagen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private ProductoEntity producto;

    @Column(name = "url_imagen", nullable = false, length = 500)
    private String urlImagen;

    @Column(name = "orden", nullable = false)
    private Integer orden;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public ProductoImagenEntity(ProductoEntity producto, String urlImagen, Integer orden) {
        this.producto = producto;
        this.urlImagen = urlImagen;
        this.orden = orden;
        this.estado = true;
    }

    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = true;
        }
    }
}