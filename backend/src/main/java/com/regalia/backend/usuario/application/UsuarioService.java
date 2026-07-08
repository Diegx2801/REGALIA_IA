package com.regalia.backend.usuario.application;

import com.regalia.backend.rol.application.RolService;
import com.regalia.backend.rol.infrastructure.entity.RolEntity;
import com.regalia.backend.shared.exception.RecursoDuplicadoException;
import com.regalia.backend.shared.exception.RecursoNoEncontradoException;
import com.regalia.backend.shared.exception.ReglaNegocioException;
import com.regalia.backend.shared.response.PaginaResponse;
import com.regalia.backend.usuario.api.dto.UsuarioActualizarRequest;
import com.regalia.backend.usuario.api.dto.UsuarioRequest;
import com.regalia.backend.usuario.api.dto.UsuarioResponse;
import com.regalia.backend.usuario.infrastructure.entity.UsuarioEntity;
import com.regalia.backend.usuario.infrastructure.mapper.UsuarioMapper;
import com.regalia.backend.usuario.infrastructure.repository.UsuarioJpaRepository;
import com.regalia.backend.usuariorol.infrastructure.entity.UsuarioRolEntity;
import com.regalia.backend.usuariorol.infrastructure.repository.UsuarioRolJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Servicio de aplicación para gestionar usuarios.
 */
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private static final String ROL_ADMIN = "ADMIN";
    private static final String ROL_CLIENTE = "CLIENTE";
    private static final int DEFAULT_ADMIN_PAGE = 0;
    private static final int DEFAULT_ADMIN_PAGE_SIZE = 10;
    private static final int MAX_ADMIN_PAGE_SIZE = 50;

    private final UsuarioJpaRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;
    private final RolService rolService;
    private final UsuarioRolJpaRepository usuarioRolRepository;

    // @Transactional: controla la transaccion; readOnly evita escritura accidental en consultas.
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarActivos() {
        return usuarioRepository.findByEstadoTrueOrderByIdUsuarioAsc()
                .stream()
                .map(usuarioMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PaginaResponse<UsuarioResponse> listarUsuariosGestionablesAdministracion(
            UsuarioEstadoFiltro filtro,
            String searchField,
            String search,
            Integer page,
            Integer size,
            String sort
    ) {
        UsuarioSearchField campoBusqueda = UsuarioSearchField.desde(searchField);
        UsuarioAdminSortField sortField = UsuarioAdminSortField.desde(sort);
        Sort.Direction sortDirection = UsuarioAdminSortField.direccionDesde(sort);
        String busqueda = normalizarBusqueda(search);
        Long busquedaId = obtenerBusquedaIdSiAplica(campoBusqueda, busqueda);
        int pagina = normalizarPagina(page);
        int tamanioPagina = normalizarTamanioPagina(size);
        // PAGINACION SPRING: PageRequest define pagina, tamanio y orden para consultas grandes.
        Pageable pageable = PageRequest.of(
                pagina,
                tamanioPagina,
                Sort.by(sortDirection, sortField.apiName())
        );

        Page<UsuarioResponse> usuarios = usuarioRepository.findUsuariosGestionablesAdministracion(
                        ROL_ADMIN,
                        filtro,
                        campoBusqueda,
                        busqueda,
                        busquedaId,
                        sortField,
                        sortDirection,
                        pageable
                )
                .map(usuarioMapper::toResponse);

        return new PaginaResponse<>(
                usuarios.getContent(),
                usuarios.getNumber(),
                usuarios.getSize(),
                usuarios.getTotalElements(),
                usuarios.getTotalPages(),
                usuarios.isLast()
        );
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPorId(Long id) {
        UsuarioEntity usuario = obtenerEntidadActivaPorId(id);

        return usuarioMapper.toResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarUsuarioGestionableAdministracionPorId(Long id) {
        UsuarioEntity usuario = obtenerEntidadPorId(id);

        validarUsuarioNoAdministrador(usuario.getIdUsuario());

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

        UsuarioEntity usuarioActualizado = usuarioRepository.saveAndFlush(usuario);

        return usuarioMapper.toResponse(usuarioActualizado);
    }

    @Transactional
    public void desactivar(Long id) {
        UsuarioEntity usuario = obtenerEntidadActivaPorId(id);

        usuario.setEstado(false);

        usuarioRepository.save(usuario);
    }

    @Transactional
    public UsuarioResponse desactivarUsuarioGestionableAdministracion(Long id) {
        UsuarioEntity usuario = obtenerEntidadPorId(id);

        validarUsuarioNoAdministrador(usuario.getIdUsuario());

        usuario.setEstado(false);

        UsuarioEntity usuarioActualizado = usuarioRepository.saveAndFlush(usuario);

        return usuarioMapper.toResponse(usuarioActualizado);
    }

    @Transactional
    public UsuarioResponse reactivarUsuarioGestionableAdministracion(Long id) {
        UsuarioEntity usuario = obtenerEntidadPorId(id);

        validarUsuarioNoAdministrador(usuario.getIdUsuario());

        usuario.setEstado(true);

        UsuarioEntity usuarioActualizado = usuarioRepository.saveAndFlush(usuario);

        return usuarioMapper.toResponse(usuarioActualizado);
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

        UsuarioEntity usuarioActualizado = usuarioRepository.saveAndFlush(usuario);

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

    private void validarUsuarioNoAdministrador(Long idUsuario) {
        if (usuarioRolRepository.existsByUsuarioIdUsuarioAndRolNombreIgnoreCaseAndEstadoTrue(idUsuario, ROL_ADMIN)) {
            throw new ReglaNegocioException("Las cuentas administrativas no se gestionan desde este módulo");
        }
    }

    private String normalizarBusqueda(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }

    private Long obtenerBusquedaIdSiAplica(UsuarioSearchField campoBusqueda, String busqueda) {
        if (busqueda == null || campoBusqueda != UsuarioSearchField.ID_USUARIO) {
            return null;
        }

        try {
            return Long.valueOf(busqueda);
        } catch (NumberFormatException exception) {
            throw new ReglaNegocioException("El ID de usuario debe ser numerico");
        }
    }

    private int normalizarPagina(Integer page) {
        if (page == null) {
            return DEFAULT_ADMIN_PAGE;
        }

        if (page < 0) {
            throw new ReglaNegocioException("La pagina no puede ser negativa");
        }

        return page;
    }

    private int normalizarTamanioPagina(Integer size) {
        if (size == null) {
            return DEFAULT_ADMIN_PAGE_SIZE;
        }

        if (size < 1) {
            throw new ReglaNegocioException("El tamanio de pagina debe ser mayor a cero");
        }

        if (size > MAX_ADMIN_PAGE_SIZE) {
            throw new ReglaNegocioException("El tamanio maximo permitido por pagina es 50");
        }

        return size;
    }

    private UsuarioEntity obtenerEntidadActivaPorId(Long id) {
        return usuarioRepository.findById(id)
                .filter(UsuarioEntity::getEstado)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario con ID: " + id));
    }

    private UsuarioEntity obtenerEntidadPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario con ID: " + id));
    }

    private UsuarioEntity obtenerEntidadActivaPorCorreo(String correo) {
        return usuarioRepository.findByCorreoIgnoreCaseAndEstadoTrue(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario autenticado"));
    }
}
