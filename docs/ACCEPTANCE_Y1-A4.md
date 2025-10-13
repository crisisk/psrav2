# Acceptatieverslag Y1-A.4 – Pre-commit hook voor RaC

## Doel
Zorg dat lokale commits standaard de RaC-validatie, linting en typechecks uitvoeren.

## Deliverable
- `.pre-commit-config.yaml` met ruff, black, mypy en RaC-validatie-hook

## Testen
- `poetry run pre-commit run --all-files`

## Resultaat
Alle hooks draaien succesvol; fouten in schema of linting blokkeren commits doordat pre-commit een non-zero exit code retourneert.
