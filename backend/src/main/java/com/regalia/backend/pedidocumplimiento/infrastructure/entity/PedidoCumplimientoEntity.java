package com.regalia.backend.pedidocumplimiento.infrastructure.entity;

import com.regalia.backend.pedido.infrastructure.entity.PedidoEntity;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Estado de la entrega de un pedido. Mantiene el secreto de confirmacion
 * protegido mediante hash y evita acoplar datos de cumplimiento a pedido.
 */
@Entity
@Table(name = "pedido_cumplimiento")
@Getter
@Setter
@NoArgsConstructor
public class PedidoCumplimientoEntity {

    public static final String METODO_CODIGO_ENTREGA = "CODIGO_ENTREGA";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido_cumplimiento")
    private Long idPedidoCumplimiento;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pedido", nullable = false, unique = true)
    private PedidoEntity pedido;

    @Column(name = "metodo_confirmacion", nullable = false, length = 30)
    private String metodoConfirmacion;

    @Column(name = "codigo_hash", nullable = false, length = 255)
    private String codigoHash;

    @Column(name = "fecha_expiracion_codigo", nullable = false)
    private LocalDateTime fechaExpiracionCodigo;

    @Column(name = "intentos_codigo", nullable = false)
    private Integer intentosCodigo = 0;

    @Column(name = "fecha_listo", nullable = false)
    private LocalDateTime fechaListo;

    @Column(name = "fecha_confirmacion")
    private LocalDateTime fechaConfirmacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario_confirmador")
    private UsuarioEntity usuarioConfirmador;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        fechaCreacion = LocalDateTime.now();
        if (intentosCodigo == null) intentosCodigo = 0;
    }

    @PreUpdate
    public void preUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
