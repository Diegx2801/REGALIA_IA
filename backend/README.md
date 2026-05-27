# REGALIA Backend

Backend Spring Boot inicial para el MVP de REGALIA.

## Capas

- `domain`: modelos, enums y contratos de repositorio.
- `application`: casos de uso, como matching inteligente.
- `infrastructure`: implementaciones mock/in-memory.
- `api`: controladores REST.

## Endpoints MVP

- `GET /api/providers`
- `POST /api/matches`
- `GET /api/orders`

## Ejecutar

```bash
mvn spring-boot:run
```
