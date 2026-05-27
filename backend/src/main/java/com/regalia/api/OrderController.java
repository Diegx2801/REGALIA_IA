package com.regalia.api;

import com.regalia.domain.model.OrderStatus;
import com.regalia.domain.model.RegaliaCategory;
import com.regalia.domain.model.RegaliaOrder;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @GetMapping
    public List<RegaliaOrder> findAll() {
        return List.of(
                new RegaliaOrder(1001L, "Andrea M.", "Floralia Studio", RegaliaCategory.FLOWERS,
                        "Aniversario", OrderStatus.ACCEPTED, 120, 12, 3.6),
                new RegaliaOrder(1002L, "Carlos P.", "Dulce Detalle Trujillo", RegaliaCategory.CUSTOM_BAKERY,
                        "Graduacion", OrderStatus.IN_PROGRESS, 150, 15, 4.5)
        );
    }
}
