package com.regalia.domain.repository;

import com.regalia.domain.model.Provider;
import java.util.List;

public interface ProviderRepository {
    List<Provider> findAll();
}
