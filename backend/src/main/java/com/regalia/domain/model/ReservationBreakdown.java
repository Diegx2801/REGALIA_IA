package com.regalia.domain.model;

public record ReservationBreakdown(
        int estimatedOrder,
        int reservation,
        double platformCommission,
        double providerCredit
) {
}
