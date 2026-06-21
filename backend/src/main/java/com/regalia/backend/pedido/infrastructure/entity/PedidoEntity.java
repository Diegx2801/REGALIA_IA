package com.regalia.backend.pedido.infrastructure.entity;

import com.regalia.backend.tienda.infrastructure.entity.TiendaEntity;
import com.regalia.backend.tipoentrega.infrastructure.entity.TipoEntregaEntity;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad que representa un pedido confirmado en REGALIA.
 * El pedido se registra recién cuando existe un pago inicial asociado:
 * SENA o PAGO_COMPLETO.
 */
@Entity
@Table(name = "pedido")
@Getter
@Setter
@NoArgsConstructor
public class PedidoEntity {

    public static final String ESTADO_RESERVADO = "RESERVADO";
    public static final String ESTADO_EN_PREPARACION = "EN_PREPARACION";
    public static final String ESTADO_LISTO = "LISTO";
    public static final String ESTADO_ENTREGADO = "ENTREGADO";
    public static final String ESTADO_ANULADO = "ANULADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Long idPedido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", nullable = false)
    private UsuarioEntity usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tienda", nullable = false)
    private TiendaEntity tienda;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo_entrega", nullable = false)
    private TipoEntregaEntity tipoEntrega;

    @Column(name = "fecha_entrega", nullable = false)
    private LocalDate fechaEntrega;

    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "estado_pedido", nullable = false, length = 30)
    private String estadoPedido = ESTADO_RESERVADO;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

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

        if (this.estadoPedido == null || this.estadoPedido.isBlank()) {
            this.estadoPedido = ESTADO_RESERVADO;
        }

        if (this.subtotal == null) {
            this.subtotal = BigDecimal.ZERO;
        }

        if (this.total == null) {
            this.total = BigDecimal.ZERO;
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