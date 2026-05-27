package com.regalia.domain.model;

public record RegaliaOrder(
        Long id,
        String clientName,
        String providerName,
        RegaliaCategory category,
        String occasion,
        OrderStatus status,
        int total,
        int reservation,
        double commission
) {
}
