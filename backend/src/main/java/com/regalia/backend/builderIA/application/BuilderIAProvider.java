package com.regalia.backend.builderIA.application;

/** Puerto de salida para proveedores de asistencia inteligente del Builder IA. */
public interface BuilderIAProvider {

    String consultarRecomendaciones(String prompt);

    String consultarChat(String prompt);
}
