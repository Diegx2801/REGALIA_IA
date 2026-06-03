package com.regalia.backend.shared.response;

/**
 * Estructura estándar de respuesta para la API siguiendo el estilo JSend.
 */
public record ApiResponse<T>(
        String status,
        T data,
        String message
) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("success", data, null);
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>("success", data, message);
    }

    public static <T> ApiResponse<T> fail(T data, String message) {
        return new ApiResponse<>("fail", data, message);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>("error", null, message);
    }
}