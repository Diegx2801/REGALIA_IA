package com.regalia.domain.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GiftRequest(
        @NotBlank String need,
        @NotBlank String occasion,
        @Min(20) @Max(2000) int budget,
        @NotBlank String style,
        @NotBlank String deliveryDate,
        @NotBlank String district,
        @NotNull Boolean urgent
) {
}
