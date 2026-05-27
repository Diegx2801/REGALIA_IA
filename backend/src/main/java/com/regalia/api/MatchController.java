package com.regalia.api;

import com.regalia.application.MatchingService;
import com.regalia.domain.model.GiftRequest;
import com.regalia.domain.model.MatchRecommendation;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matches")
public class MatchController {
    private final MatchingService matchingService;

    public MatchController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @PostMapping
    public List<MatchRecommendation> match(@Valid @RequestBody GiftRequest request) {
        return matchingService.match(request);
    }
}
