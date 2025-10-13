# Acceptatieverslag Y1-A.13 – Next.js LTSD API routes

## Doel
Implementeer frontend-to-backend API-bruggen voor LTSD-evaluaties en certificaatgeneratie met Zod-validatie, upstream timeouts en audit-proof headers.

## Deliverables
- `app/api/ltsd-addon/evaluate/route.ts` en `app/api/ltsd-addon/generate/route.ts` met camel⇄snake conversie, Zod-validatie en foutafhandeling.
- `app/api/certificates/[id]/route.ts` voor certificate detailopvraging met Zod-guards.
- `lib/integrations/ltsd-service.ts` + `lib/integrations/ltsd-contracts.ts` + `lib/utils/case.ts` voor canonical contracten, service calls en sleutelconversie.
- Vitest regressies in `tests/api/ltsd-addon.routes.test.ts` die success, error en streamingpaden afdekken.

## Bewijslast
- ✅ `npm run test -- tests/api/ltsd-addon.routes.test.ts`

## Opmerkingen
- Payloads worden client-side in camelCase geaccepteerd en server-side naar snake_case geconverteerd vóór validatie om aligned te blijven met de Pydantic-contracten.
- Timeout en foutpropagatie zijn uniform gemaakt met `LtsdServiceError`, zodat upstream problemen met juiste HTTP-statussen en meldingen doorsijpelen naar de UI.
