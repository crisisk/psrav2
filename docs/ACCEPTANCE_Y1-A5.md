# Acceptatieverslag Y1-A.5 – CI gate voor RaC

## Doel
PR’s blokkeren wanneer RaC-validatie of golden tests falen.

## Deliverable
- GitHub Actions workflow `.github/workflows/rac-gate.yml`

## Testen
- `act pull_request --job rac-validate` (lokaal of in CI)
- Review van workflowconfiguratie door DevSecOps-team

## Resultaat
Workflow voert pre-commit en golden tests automatisch uit op elke PR. Fouten resulteren in een mislukte job, waarmee de merge wordt tegengehouden.
