package com.regalia.backend.builderIA.api;

import com.regalia.backend.builderIA.api.dto.BuilderIAChatRequest;
import com.regalia.backend.builderIA.api.dto.BuilderIAChatResponse;
import com.regalia.backend.builderIA.api.dto.BuilderIARecomendacionRequest;
import com.regalia.backend.builderIA.api.dto.BuilderIARecomendacionResponse;
import com.regalia.backend.builderIA.application.BuilderIAService;
import com.regalia.backend.shared.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API del asistente IA del builder para recomendar productos reales de REGALIA.
 */
@RestController
@RequestMapping("/api/builder-ia")
@RequiredArgsConstructor
public class BuilderIAController {

    private final BuilderIAService builderIAService;

    @PostMapping("/recomendar-productos")
    public ResponseEntity<ApiResponse<BuilderIARecomendacionResponse>> recomendarProductos(
            @Valid @RequestBody BuilderIARecomendacionRequest request
    ) {
        BuilderIARecomendacionResponse response = builderIAService.recomendarProductos(request);

        return ResponseEntity.ok(
                ApiResponse.success(response)
        );
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<BuilderIAChatResponse>> responderChat(
            @Valid @RequestBody BuilderIAChatRequest request
    ) {
        BuilderIAChatResponse response = builderIAService.responderChat(request.pregunta());

        return ResponseEntity.ok(
                ApiResponse.success(response)
        );
    }
}
