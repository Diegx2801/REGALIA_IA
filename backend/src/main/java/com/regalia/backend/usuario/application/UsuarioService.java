package com.regalia.backend.usuario.application;

import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.usuario.api.dto.UsuarioActualizarRequest;
import com.regalia.backend.usuario.api.dto.UsuarioRequest;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.mapper.UsuarioMapper;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
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

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

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

    private UsuarioEntity obtenerEntidadActivaPorId(Long id) {
        return usuarioRepository.findById(id)
                .filter(UsuarioEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario con ID: " + id));
    }
}