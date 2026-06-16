package com.regalia.backend.tiendarubro.infrastructure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * Clave primaria compuesta para la tabla tienda_rubro.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Embeddable
public class TiendaRubroId implements Serializable {

    @Column(name = "id_tienda")
    private Long idTienda;

    @Column(name = "id_rubro")
    private Long idRubro;
}