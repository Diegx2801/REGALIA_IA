package com.regalia.backend.vendedor.application;

import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.rol.infrastructure.repository.RolJpaRepository;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariodocumento.infrastructure.repository.UsuarioDocumentoJpaRepository;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolEntity;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolId;
import com.regalia.backend.usuariorol.infrastructure.repository.UsuarioRolJpaRepository;
import com.regalia.backend.vendedor.api.dto.VendedorResponse;
import com.regalia.backend.vendedor.infrastructure.entity.VendedorEntity;
import com.regalia.backend.vendedor.infrastructure.mapper.VendedorMapper;
import com.regalia.backend.vendedor.infrastructure.repository.VendedorJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio de aplicación para gestionar el perfil vendedor del usuario autenticado.
 */
@Service
@RequiredArgsConstructor
public class VendedorService {

    private static final String ROL_VENDEDOR = "VENDEDOR";
    private static final String ESTADO_VERIFICADO = "VERIFICADO";
    private static final String CATEGORIA_IDENTIDAD_PERSONAL = "IDENTIDAD_PERSONAL";

    private final VendedorJpaRepository vendedorRepository;
    private final UsuarioJpaRepository usuarioRepository;
    private final RolJpaRepository rolRepository;
    private final UsuarioRolJpaRepository usuarioRolRepository;
    private final UsuarioDocumentoJpaRepository usuarioDocumentoRepository;
    private final VendedorMapper vendedorMapper;

    @Transactional
    public VendedorResponse crearMiPerfilVendedor(String correoUsuario) {
        UsuarioEntity usuario = obtenerUsuarioActivoPorCorreo(correoUsuario);

        validarQueNoTengaVendedorActivo(usuario.getIdUsuario());

        VendedorEntity vendedor = new VendedorEntity();
        vendedor.setUsuario(usuario);
        vendedor.setEstado(true);

        VendedorEntity vendedorGuardado = vendedorRepository.save(vendedor);

        asignarRolVendedor(usuario);

        Boolean vendedorVerificado = calcularVendedorVerificado(usuario.getIdUsuario());

        return vendedorMapper.toResponse(vendedorGuardado, vendedorVerificado);
    }

    @Transactional(readOnly = true)
    public VendedorResponse obtenerMiPerfilVendedor(String correoUsuario) {
        VendedorEntity vendedor = vendedorRepository.findByUsuarioCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró un perfil vendedor activo para el usuario autenticado"));

        Boolean vendedorVerificado = calcularVendedorVerificado(vendedor.getUsuario().getIdUsuario());

        return vendedorMapper.toResponse(vendedor, vendedorVerificado);
    }

    private UsuarioEntity obtenerUsuarioActivoPorCorreo(String correoUsuario) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correoUsuario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario autenticado"));
    }

    private void validarQueNoTengaVendedorActivo(Long idUsuario) {
        if (vendedorRepository.existsByUsuarioIdUsuarioAndEstadoTrue(idUsuario)) {
            throw new RecursoDuplicadoException("El usuario ya tiene un perfil vendedor activo");
        }
    }

    private void asignarRolVendedor(UsuarioEntity usuario) {
        RolEntity rolVendedor = rolRepository.findByNombreIgnoreCaseAndEstadoTrue(ROL_VENDEDOR)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el rol VENDEDOR configurado en el sistema"));

        UsuarioRolId usuarioRolId = new UsuarioRolId(usuario.getIdUsuario(), rolVendedor.getIdRol());

        usuarioRolRepository.findById(usuarioRolId)
                .ifPresentOrElse(
                        usuarioRolExistente -> {
                            if (!Boolean.TRUE.equals(usuarioRolExistente.getEstado())) {
                                usuarioRolExistente.setEstado(true);
                                usuarioRolRepository.save(usuarioRolExistente);
                            }
                        },
                        () -> {
                            UsuarioRolEntity nuevoUsuarioRol = new UsuarioRolEntity(usuario, rolVendedor);
                            usuarioRolRepository.save(nuevoUsuarioRol);
                        }
                );
    }

    private Boolean calcularVendedorVerificado(Long idUsuario) {
        return usuarioDocumentoRepository.existsDocumentoVerificadoPorCategoria(
                idUsuario,
                ESTADO_VERIFICADO,
                CATEGORIA_IDENTIDAD_PERSONAL
        );
    }
}