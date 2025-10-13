# Acceptatieverslag Y1-A.1 – Strict JSON Schema v2

## Doel
Definiëren van een streng JSON Schema voor Rules-as-Code gebaseerd op versie 2.0 van het domeinmodel.

## Deliverable
- `psr/schema/psr_rule.schema.v2.json`
- Gevalideerde voorbeeldregels in `psr/rules/hs39` en `psr/rules/hs40`

## Testen
- `python -m psr.loader.psr_loader --schema psr/schema/psr_rule.schema.v2.json --rules-dir psr/rules`

## Resultaat
Alle voorbeeldregels worden succesvol gevalideerd tegen het nieuwe schema. Er zijn geen schemafouten aangetroffen.
