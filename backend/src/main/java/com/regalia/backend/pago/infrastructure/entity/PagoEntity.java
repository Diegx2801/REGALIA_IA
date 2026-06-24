package com.regalia.backend.pago.infrastructure.entity;

import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.tipopago.infrastructure.entity.TipoPagoEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa un pago real asociado a un pedido.
 * Puede ser SEÑA, RESTANTE, PAGO COMPLETO u otros tipos futuros.
 */
@Entity
@Table(name = "pago")
@Getter
@Setter
@NoArgsConstructor
public class PagoEntity {

    public static final String ESTADO_APROBADO = "APROBADO";
    public static final String ESTADO_REEMBOLSADO = "REEMBOLSADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pago")
    private Long idPago;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido", nullable = false)
    private PedidoEntity pedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_pago", nullable = false)
    private TipoPagoEntity tipoPago;

    @Column(name = "monto", nullable = false, precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "estado_pago", nullable = false, length = 30)
    private String estadoPago = ESTADO_APROBADO;

    @Column(name = "metodo_pago_pasarela", length = 80)
    private String metodoPagoPasarela;

    @Column(name = "codigo_transaccion", length = 150)
    private String codigoTransaccion;

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

        if (this.estadoPago == null || this.estadoPago.isBlank()) {
            this.estadoPago = ESTADO_APROBADO;
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