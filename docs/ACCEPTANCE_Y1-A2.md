# Acceptatieverslag Y1-A.2 – Native validator (Rust + Python bindings)

## Doel
Implementeer een snelle Rust-gebaseerde parser/validator met Python bindings voor RaC-validatie.

## Deliverable
- `psr/validator-rs/` native module
- `psr/validator/__init__.py` Python bindings
- CLI integratie via `psr/loader/psr_loader.py`

## Testen
- `VIRTUAL_ENV=$(python -c 'import sys; print(sys.prefix)') maturin develop --manifest-path psr/validator-rs/Cargo.toml`
- `python -c "from psr.validator import validate_rule; assert not validate_rule('psr/schema/psr_rule.schema.v2.json', 'psr/rules/hs39/ceta_polymer_rule.yaml')"`

## Resultaat
De native module wordt succesvol gebouwd en retourneert een lege foutenset voor geldige regels. Foutscenario’s leveren duidelijke validatiemeldingen.
