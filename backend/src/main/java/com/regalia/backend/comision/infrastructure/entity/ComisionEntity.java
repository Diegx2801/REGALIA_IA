package com.regalia.backend.comision.infrastructure.entity;

import com.regalia.backend.pago.infrastructure.entity.PagoEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa la comisión generada para REGALIA por cada pago.
 */
@Entity
@Table(name = "comision")
@Getter
@Setter
@NoArgsConstructor
public class ComisionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_comision")
    private Long idComision;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pago", nullable = false, unique = true)
    private PagoEntity pago;

    @Column(name = "porcentaje", nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentaje;

    @Column(name = "monto_comision", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoComision;

    @Column(name = "monto_neto_vendedor", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoNetoVendedor;

    @Column(name = "estado", nullable = false)
    private Boolean estado = true;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    /**
     * Asigna valores iniciales antes de insertar el registro.
     */
    @PrePersist
    public void prePersist() {
        this.fechaCreacion = LocalDateTime.now();

        if (this.estado == null) {
            this.estado = true;
        }
    }

    /**
     * Actualiza la fecha de actualización antes de actualizar el registro.
     */
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}