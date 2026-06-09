package com.regalia.backend.usuario.application;

import com.regalia.backend.rol.application.RolService;
import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.usuario.api.dto.UsuarioActualizarRequest;
import com.regalia.backend.usuario.api.dto.UsuarioRequest;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.mapper.UsuarioMapper;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolEntity;
import com.regalia.backend.usuariorol.infrastructure.repository.UsuarioRolJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio de aplicación para gestionar usuarios.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final String ROL_CLIENTE = "CLIENTE";

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final RolService rolService;
    private final UsuarioRolJpaRepository usuarioRolRepository;

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarActivos() {
        return usuarioRepository.findByEstadoTrueOrderByIdUsuarioAsc()
                .stream()
                .map(usuarioMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Long id) {
        UsuarioEntity usuario = obtenerEntidadActivaPorId(id);

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        String correoNormalizado = request.correo().trim().toLowerCase();

        if (usuarioRepository.existsByCorreoIgnoreCase(correoNormalizado)) {
            throw new RecursoDuplicadoException("Ya existe un usuario registrado con ese correo");
        }

        String contrasenaHash = passwordEncoder.encode(request.contrasena());

        UsuarioEntity usuario = usuarioMapper.toEntity(request, contrasenaHash);
        UsuarioEntity usuarioGuardado = usuarioRepository.save(usuario);

        asignarRolCliente(usuarioGuardado);

        return usuarioMapper.toResponse(usuarioGuardado);
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioActualizarRequest request) {
        UsuarioEntity usuario = obtenerEntidadActivaPorId(id);

        usuarioMapper.updateEntity(usuario, request);
        usuario.setFechaActualizacion(LocalDateTime.now());

        UsuarioEntity usuarioActualizado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(usuarioActualizado);
    }

    @Transactional
    public void desactivar(Long id) {
        UsuarioEntity usuario = obtenerEntidadActivaPorId(id);

        usuario.setEstado(false);
        usuario.setFechaActualizacion(LocalDateTime.now());

        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPerfilAutenticado(String correo) {
        UsuarioEntity usuario = obtenerEntidadActivaPorCorreo(correo);

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional
    public UsuarioResponse actualizarPerfilAutenticado(String correo, UsuarioActualizarRequest request) {
        UsuarioEntity usuario = obtenerEntidadActivaPorCorreo(correo);

        usuarioMapper.updateEntity(usuario, request);
        usuario.setFechaActualizacion(LocalDateTime.now());

        UsuarioEntity usuarioActualizado = usuarioRepository.save(usuario);

        return usuarioMapper.toResponse(usuarioActualizado);
    }

    private void asignarRolCliente(UsuarioEntity usuario) {
        RolEntity rolCliente = rolService.obtenerEntidadActivaPorNombre(ROL_CLIENTE);

        boolean yaTieneRolCliente = usuarioRolRepository
                .existsByUsuarioIdUsuarioAndRolIdRolAndEstadoTrue(
                        usuario.getIdUsuario(),
                        rolCliente.getIdRol()
                );

        if (!yaTieneRolCliente) {
            UsuarioRolEntity usuarioRol = new UsuarioRolEntity(usuario, rolCliente);
            usuarioRolRepository.save(usuarioRol);
        }
    }

    private UsuarioEntity obtenerEntidadActivaPorId(Long id) {
        return usuarioRepository.findById(id)
                .filter(UsuarioEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario con ID: " + id));
    }

    private UsuarioEntity obtenerEntidadActivaPorCorreo(String correo) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario autenticado"));
    }
}