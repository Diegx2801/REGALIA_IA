package com.regalia.application;

import com.regalia.domain.model.GiftRequest;
import com.regalia.domain.model.MatchRecommendation;
import com.regalia.domain.model.Provider;
import com.regalia.domain.model.RegaliaCategory;
import com.regalia.domain.model.ReservationBreakdown;
import com.regalia.domain.repository.ProviderRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MatchingService {
    private final ProviderRepository providerRepository;

    public MatchingService(ProviderRepository providerRepository) {
        this.providerRepository = providerRepository;
    }

    public List<MatchRecommendation> match(GiftRequest request) {
        RegaliaCategory category = inferCategory(request.need());

        return providerRepository.findAll().stream()
                .map(provider -> recommendation(provider, request, category))
                .filter(recommendation -> recommendation.score() >= 60)
                .sorted(Comparator.comparing(MatchRecommendation::score).reversed())
                .toList();
    }

    private MatchRecommendation recommendation(Provider provider, GiftRequest request, RegaliaCategory category) {
        int score = score(provider, request, category);
        int estimatedOrder = Math.min(Math.max(request.budget(), provider.priceFrom()), provider.priceTo());
        int reservation = Math.max(10, Math.round(estimatedOrder * 0.1f));
        double commission = Math.round(reservation * 0.3 * 10.0) / 10.0;

        return new MatchRecommendation(
                provider,
                score,
                "Recomendado por categoria, reputacion, presupuesto referencial y disponibilidad.",
                category,
                new ReservationBreakdown(estimatedOrder, reservation, commission, reservation - commission)
        );
    }

    private int score(Provider provider, GiftRequest request, RegaliaCategory category) {
        int categoryScore = provider.category() == category ? 35 : 10;
        int budgetScore = request.budget() >= provider.priceFrom() ? 25 : 8;
        int urgencyScore = Boolean.TRUE.equals(request.urgent()) && provider.deliveryTime().toLowerCase().contains("mismo") ? 15 : 8;
        int styleScore = provider.styles().stream().anyMatch(style -> request.style().toLowerCase().contains(style)) ? 15 : 6;
        int reputationScore = Math.round(provider.reputation() / 10f);

        return Math.min(99, categoryScore + budgetScore + urgencyScore + styleScore + reputationScore);
    }

    private RegaliaCategory inferCategory(String need) {
        String normalized = need.toLowerCase();

        if (normalized.contains("flor") || normalized.contains("ramo")) return RegaliaCategory.FLOWERS;
        if (normalized.contains("torta") || normalized.contains("dulce")) return RegaliaCategory.CUSTOM_BAKERY;
        if (normalized.contains("caja") || normalized.contains("desayuno")) return RegaliaCategory.SURPRISE_BOXES;
        if (normalized.contains("taza") || normalized.contains("polo")) return RegaliaCategory.SUBLIMATION;
        if (normalized.contains("madera") || normalized.contains("grabado")) return RegaliaCategory.WOODCRAFT;
        if (normalized.contains("decor")) return RegaliaCategory.EVENT_DECORATION;

        return RegaliaCategory.SURPRISE_BOXES;
    }
}
