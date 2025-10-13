# Sevensa Platform Developer Onboarding Guide

## Welkom bij het Sevensa Platform Team!

Dit document dient als een uitgebreide gids voor nieuwe ontwikkelaars die zich bij het Sevensa Platform team voegen. Het biedt een overzicht van onze architectuur, ontwikkelprocessen, tools, en best practices. Het doel is om je zo snel mogelijk productief te maken terwijl je een goed begrip krijgt van onze technische omgeving.

## Inhoudsopgave

1. [Platform Overzicht](#1-platform-overzicht)
2. [Ontwikkelomgeving Setup](#2-ontwikkelomgeving-setup)
3. [Architectuur & Componenten](#3-architectuur--componenten)
4. [Ontwikkelprocessen](#4-ontwikkelprocessen)
5. [Code Standards & Best Practices](#5-code-standards--best-practices)
6. [Testing Strategie](#6-testing-strategie)
7. [Deployment Pipeline](#7-deployment-pipeline)
8. [Monitoring & Observability](#8-monitoring--observability)
9. [Security Practices](#9-security-practices)
10. [Veelvoorkomende Problemen & Oplossingen](#10-veelvoorkomende-problemen--oplossingen)
11. [Nuttige Resources](#11-nuttige-resources)

## 1. Platform Overzicht

Het Sevensa Platform is een multi-tenant SaaS oplossing die bestaat uit verschillende gespecialiseerde services:

### RentGuy

RentGuy is onze PropTech oplossing voor vastgoedbeheer. Het stelt vastgoedeigenaren en -beheerders in staat om hun portfolio efficiënt te beheren, inclusief huurcontracten, onderhoud, en financiële administratie.

**Technische Stack:**
- Frontend: React met TypeScript
- Backend: Node.js met Express
- Database: PostgreSQL
- Caching: Redis
- Messaging: RabbitMQ

### PSRA-LTSD

PSRA-LTSD (Preferential Status & Rules Assessment - Long-Term Supplier Declaration) is onze trade compliance oplossing. Het helpt bedrijven bij het bepalen van de preferentiële oorsprong van producten voor internationale handel.

**Technische Stack:**
- Frontend: Vue.js
- Backend: Python met FastAPI
- Database: PostgreSQL
- AI Component: LangGraph Origin Engine
- Document Processing: PyPDF2, Tesseract OCR

### WPCS

WPCS (WordPress Content Suite) is onze managed WordPress hosting en content management oplossing. Het biedt een veilige, schaalbare omgeving voor WordPress websites met geavanceerde content management functionaliteit.

**Technische Stack:**
- WordPress Core
- Custom PHP Extensions
- Nginx
- MariaDB
- Redis Object Cache
- Varnish Cache

### AI Orchestration

De AI Orchestration laag verbindt en coördineert AI-gedreven processen binnen het platform. Het maakt gebruik van LangGraph voor complexe reasoning workflows en N8N voor integratie en automatisering.

**Technische Stack:**
- LangGraph (Python)
- N8N Workflow Automation
- OpenAI API Integratie
- Vector Database (Pinecone)
- Redis voor state management

## 2. Ontwikkelomgeving Setup

### Vereisten

- Docker en Docker Compose
- Git
- Node.js (v18+)
- Python (3.11+)
- IDE naar keuze (VS Code aanbevolen met onze gedeelde extensie pack)

### Repository Clonen

```bash
# Clone de centrale infrastructuur repository
git clone git@github.com:sevensa/sevensa-infra.git

# Clone service-specifieke repositories
git clone git@github.com:sevensa/rentguy.git
git clone git@github.com:sevensa/psra-ltsd.git
git clone git@github.com:sevensa/wpcs.git
git clone git@github.com:sevensa/ai-orchestration.git
```

### Lokale Ontwikkelomgeving

We gebruiken Docker Compose voor lokale ontwikkeling. Elke service repository bevat een `docker-compose.dev.yml` bestand dat de service en zijn dependencies opstart.

```bash
# Voorbeeld voor RentGuy
cd rentguy
cp .env.example .env  # Vul de benodigde waarden in
docker-compose -f docker-compose.dev.yml up -d
```

### Development Tools

- **VS Code Extensions**: Installeer onze aanbevolen extensies via de `sevensa-vscode-extensions` package
- **Git Hooks**: We gebruiken Husky voor pre-commit en pre-push hooks
- **Linting & Formatting**: ESLint, Prettier voor JavaScript/TypeScript; Black, isort, flake8 voor Python
- **Database Tools**: DBeaver of pgAdmin voor PostgreSQL management

## 3. Architectuur & Componenten

### Hoog-niveau Architectuur

Het Sevensa Platform volgt een microservices architectuur met de volgende kenmerken:

- **Multi-tenant**: Alle services ondersteunen multi-tenancy voor isolatie tussen klanten
- **API-first**: Alle functionaliteit is beschikbaar via RESTful APIs
- **Event-driven**: Services communiceren via events voor asynchrone processen
- **Zero-Trust Security**: Strikte authenticatie en autorisatie voor alle service-to-service communicatie

### Infrastructuur Componenten

- **Traefik**: API Gateway en reverse proxy
- **OpenBao**: Secret management (HashiCorp Vault alternatief)
- **Keycloak**: Identity en access management
- **Prometheus/Grafana**: Monitoring en observability
- **Loki/Promtail**: Log aggregatie
- **Jaeger**: Distributed tracing

### Service Communicatie

Services communiceren via:

1. **Synchrone API calls**: Voor directe request-response interacties
2. **Asynchrone events**: Via RabbitMQ voor event-driven processen
3. **Shared databases**: In specifieke gevallen waar nodig

### Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Clients   │────▶│   Traefik   │────▶│  Services   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                          ┌───────────────────┐│┌───────────────────┐
                          │  OpenBao (Vault)  │││     Keycloak      │
                          └───────────────────┘││└───────────────────┘
                                               │
                          ┌───────────────────┐│┌───────────────────┐
                          │    Databases      │││     Message       │
                          │   (PostgreSQL)    │││    Broker (RMQ)   │
                          └───────────────────┘│└───────────────────┘
                                               │
                          ┌───────────────────┐│┌───────────────────┐
                          │    Monitoring     │││      Logging      │
                          │(Prometheus/Grafana)│││   (Loki/Promtail) │
                          └───────────────────┘└└───────────────────┘
```

## 4. Ontwikkelprocessen

### Git Workflow

We volgen een trunk-based development model met feature branches:

1. Creëer een feature branch vanaf `main`: `feature/feature-name`
2. Ontwikkel en test je wijzigingen
3. Maak een Pull Request naar `main`
4. Code review door minimaal één team lid
5. Automatische CI checks moeten slagen
6. Merge naar `main` na goedkeuring

### Issue Tracking

We gebruiken GitHub Issues voor issue tracking met de volgende labels:

- `bug`: Een bug die moet worden opgelost
- `feature`: Een nieuwe feature
- `enhancement`: Een verbetering aan bestaande functionaliteit
- `technical-debt`: Refactoring of technische verbeteringen
- `documentation`: Documentatie updates
- `security`: Security-gerelateerde issues

### Code Reviews

Code reviews zijn een essentieel onderdeel van ons ontwikkelproces:

- Alle code wijzigingen moeten worden gereviewd
- Focus op leesbaarheid, onderhoudbaarheid, en correctheid
- Gebruik constructieve feedback
- Automatische checks moeten slagen voor review
- Gebruik de code review checklist in `.github/PULL_REQUEST_TEMPLATE.md`

### Definition of Done

Een taak is pas klaar als:

- De code is geschreven volgens onze standaarden
- Unit tests zijn geschreven en slagen
- Integration tests zijn geschreven en slagen
- Documentatie is bijgewerkt
- Code is gereviewd en goedgekeurd
- De feature is getest in een staging omgeving
- Alle acceptance criteria zijn voldaan

## 5. Code Standards & Best Practices

### Algemene Principes

- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Clean Code**: Leesbare, onderhoudbare code schrijven

### JavaScript/TypeScript Standards

- Gebruik TypeScript voor type safety
- Volg de Airbnb JavaScript Style Guide
- Gebruik ESLint en Prettier voor linting en formatting
- Gebruik async/await voor asynchrone code
- Vermijd any types in TypeScript

### Python Standards

- Volg PEP 8 style guide
- Gebruik type hints (PEP 484)
- Gebruik Black en isort voor formatting
- Gebruik flake8 voor linting
- Gebruik pytest voor testing

### API Design

- RESTful API design principes volgen
- Gebruik consistente URL structuur
- Gebruik juiste HTTP methods (GET, POST, PUT, DELETE)
- Implementeer proper error handling en status codes
- Documenteer APIs met OpenAPI/Swagger

### Database Best Practices

- Gebruik migrations voor schema wijzigingen
- Schrijf performante queries
- Gebruik indexes waar nodig
- Implementeer proper connection pooling
- Gebruik transactions waar nodig

## 6. Testing Strategie

### Test Piramide

We volgen de test piramide met:

1. **Unit Tests**: Testen van individuele functies en klassen
2. **Integration Tests**: Testen van interacties tussen componenten
3. **End-to-End Tests**: Testen van complete user flows

### Unit Testing

- Gebruik Jest voor JavaScript/TypeScript
- Gebruik pytest voor Python
- Streef naar >80% code coverage
- Mock externe dependencies
- Focus op gedrag, niet implementatie

### Integration Testing

- Test interacties tussen services
- Gebruik test containers voor dependencies
- Focus op contract testing tussen services
- Valideer database interacties

### End-to-End Testing

- Gebruik Cypress voor frontend E2E tests
- Test complete user flows
- Run E2E tests in de CI pipeline
- Focus op kritieke business flows

### Performance Testing

- Gebruik k6 voor load testing
- Definieer performance benchmarks
- Test onder verschillende load condities
- Monitor resource gebruik tijdens tests

## 7. Deployment Pipeline

### CI/CD Pipeline

We gebruiken GitHub Actions voor onze CI/CD pipeline:

1. **Build**: Compile code, run linters
2. **Test**: Run unit en integration tests
3. **Package**: Build Docker images
4. **Deploy**: Deploy naar de juiste omgeving

### Environments

We hebben de volgende environments:

- **Development**: Voor actieve ontwikkeling
- **Staging**: Voor testing en validatie
- **Production**: Live environment voor klanten

### Deployment Strategie

We gebruiken blue-green deployments voor zero-downtime updates:

1. Deploy nieuwe versie naast de oude
2. Run smoke tests op de nieuwe versie
3. Switch traffic naar de nieuwe versie
4. Monitor voor issues
5. Rollback indien nodig

### Versioning

We volgen Semantic Versioning (SemVer):

- **Major**: Breaking changes
- **Minor**: New features, backwards compatible
- **Patch**: Bug fixes, backwards compatible

## 8. Monitoring & Observability

### Metrics

We verzamelen de volgende metrics:

- **System Metrics**: CPU, memory, disk, network
- **Application Metrics**: Request rate, error rate, latency
- **Business Metrics**: User actions, conversions, etc.

### Logging

We gebruiken gestructureerde logging met de volgende niveaus:

- **ERROR**: Exceptionele gevallen die onmiddellijke aandacht vereisen
- **WARN**: Potentiële problemen die niet onmiddellijk actie vereisen
- **INFO**: Algemene informatie over systeem operatie
- **DEBUG**: Gedetailleerde informatie voor debugging

### Tracing

We gebruiken OpenTelemetry en Jaeger voor distributed tracing:

- Trace requests door het hele systeem
- Identificeer performance bottlenecks
- Debug complexe interacties tussen services

### Alerting

We hebben alerts geconfigureerd voor:

- Service downtime
- Hoge error rates
- Langzame response times
- Resource uitputting
- Security incidenten

## 9. Security Practices

### Authentication & Authorization

- Gebruik Keycloak voor identity management
- Implementeer OAuth2/OIDC voor authentication
- Gebruik role-based access control (RBAC)
- Valideer permissions voor elke actie

### Secret Management

- Gebruik OpenBao voor secret management
- Nooit secrets in code of config files
- Implementeer secret rotation
- Gebruik least privilege principe

### Secure Coding

- Valideer alle user input
- Bescherm tegen OWASP Top 10 vulnerabilities
- Gebruik prepared statements voor database queries
- Implementeer proper error handling zonder gevoelige informatie

### Security Testing

- Regelmatige vulnerability scans
- Dependency scanning in CI pipeline
- Penetration testing
- Security code reviews

## 10. Veelvoorkomende Problemen & Oplossingen

### Docker Issues

**Probleem**: Container start niet op  
**Oplossing**: Check logs met `docker logs <container_id>`, controleer port conflicts

**Probleem**: Volume permissions  
**Oplossing**: Check user/group permissions, gebruik `chown` indien nodig

### Development Environment

**Probleem**: Node modules installatie faalt  
**Oplossing**: Verwijder node_modules en package-lock.json, run `npm install` opnieuw

**Probleem**: Python dependencies conflict  
**Oplossing**: Gebruik virtual environments, controleer versie compatibiliteit

### Authentication

**Probleem**: Keycloak token validatie faalt  
**Oplossing**: Controleer client configuration, check token expiration

**Probleem**: OpenBao authentication faalt  
**Oplossing**: Vernieuw tokens, controleer policies en permissions

## 11. Nuttige Resources

### Interne Documentatie

- [Architecture Decision Records (ADRs)](https://github.com/sevensa/docs/architecture)
- [API Documentation](https://api-docs.sevensa.nl)
- [Runbooks](https://github.com/sevensa/docs/runbooks)
- [Development Guidelines](https://github.com/sevensa/docs/guidelines)

### Externe Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [OpenBao Documentation](https://openbao.org/docs/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)

### Team Contact

- **Tech Lead**: tech.lead@sevensa.nl
- **DevOps**: devops@sevensa.nl
- **Security**: security@sevensa.nl
- **Support**: support@sevensa.nl

## Conclusie

Deze onboarding guide is ontworpen om je te helpen snel productief te worden binnen het Sevensa Platform team. Als je vragen hebt of meer informatie nodig hebt, aarzel dan niet om contact op te nemen met je team lead of een van de contactpersonen hierboven.

Welkom aan boord en veel succes!
