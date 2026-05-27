package com.regalia.domain.model;

import java.util.List;

public record Provider(
        Long id,
        String businessName,
        RegaliaCategory category,
        String district,
        int priceFrom,
        int priceTo,
        String deliveryTime,
        String availability,
        double rating,
        int reputation,
        List<String> styles
) {
}
