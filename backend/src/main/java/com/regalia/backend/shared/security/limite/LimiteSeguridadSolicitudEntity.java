package com.regalia.backend.shared.security.limite;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Estado reutilizable de una cuota de seguridad. Una fila representa una
 * politica aplicada a un sujeto, no un historial de eventos.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "limite_seguridad_solicitud")
public class LimiteSeguridadSolicitudEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_limite_seguridad_solicitud")
    private Long idLimiteSeguridadSolicitud;

    @Enumerated(EnumType.STRING)
    @Column(name = "clave_politica", nullable = false, length = 80)
    private PoliticaLimiteSeguridad clavePolitica;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_sujeto", nullable = false, length = 20)
    private TipoSujetoLimiteSeguridad tipoSujeto;

    @Column(name = "clave_sujeto", nullable = false, length = 255)
    private String claveSujeto;

    @Column(name = "inicio_ventana", nullable = false)
    private LocalDateTime inicioVentana;

    @Column(name = "cantidad_solicitudes", nullable = false)
    private int cantidadSolicitudes;

    @Column(name = "fecha_ultima_solicitud", nullable = false)
    private LocalDateTime fechaUltimaSolicitud;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersist() {
        fechaCreacion = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
}
