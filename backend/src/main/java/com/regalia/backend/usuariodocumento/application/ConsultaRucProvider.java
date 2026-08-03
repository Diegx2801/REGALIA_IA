package com.regalia.backend.usuariodocumento.application;

/** Puerto de salida para consultar informacion tributaria de un RUC. */
public interface ConsultaRucProvider {

    ConsultaRuc consultar(String numeroRuc);
}
