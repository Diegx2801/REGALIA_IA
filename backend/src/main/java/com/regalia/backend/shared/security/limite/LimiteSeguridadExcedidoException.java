package com.regalia.backend.shared.security.limite;

public class LimiteSeguridadExcedidoException extends RuntimeException {

    private final TipoExcesoLimiteSeguridad tipoExceso;

    public LimiteSeguridadExcedidoException(TipoExcesoLimiteSeguridad tipoExceso) {
        this.tipoExceso = tipoExceso;
    }

    public TipoExcesoLimiteSeguridad getTipoExceso() {
        return tipoExceso;
    }
}
