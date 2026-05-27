package com.regalia.domain.model;

public record MatchRecommendation(
        Provider provider,
        int score,
        String reason,
        RegaliaCategory interpretedCategory,
        ReservationBreakdown reservation
) {
}
