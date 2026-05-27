package com.regalia.infrastructure;

import com.regalia.domain.model.Provider;
import com.regalia.domain.model.RegaliaCategory;
import com.regalia.domain.repository.ProviderRepository;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryProviderRepository implements ProviderRepository {
    private final List<Provider> providers = List.of(
            new Provider(1L, "Dulce Detalle Trujillo", RegaliaCategory.CUSTOM_BAKERY, "Victor Larco", 65, 180,
                    "24 a 48 horas", "Disponible esta semana", 4.9, 96, List.of("elegante", "premium")),
            new Provider(2L, "Floralia Studio", RegaliaCategory.FLOWERS, "Centro Historico", 45, 160,
                    "Mismo dia", "Cupos limitados hoy", 4.8, 94, List.of("romantico", "natural")),
            new Provider(3L, "Caja Bonita", RegaliaCategory.SURPRISE_BOXES, "California", 55, 220,
                    "24 horas", "Disponible", 4.7, 91, List.of("tierno", "juvenil"))
    );

    @Override
    public List<Provider> findAll() {
        return providers;
    }
}
