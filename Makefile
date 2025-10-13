.PHONY: help dev build start install test clean deploy

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "PSRA-LTSD Makefile Commands"
	@echo "==========================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server (production mode)
	npm run dev

dev-demo: ## Start development server (demo mode)
	npm run dev:demo

build: ## Build for production
	npm run build

build-demo: ## Build for demo mode
	npm run build:demo

start: ## Start production server
	npm run start

test: ## Run unit tests
	npm run test

test-e2e: ## Run Playwright E2E tests
	npm run test:e2e

test-e2e-ui: ## Run Playwright E2E tests with UI
	npm run test:e2e:ui

test-a11y: ## Run accessibility tests
	npm run test:a11y

test-all: ## Run all tests (unit + e2e + a11y)
	npm run test && npm run test:e2e && npm run test:a11y

lint: ## Run ESLint
	npm run lint

typecheck: ## Run TypeScript type checking
	npm run typecheck

format: ## Format code with Prettier
	npm run format

verify: ## Run lint, typecheck, and tests
	npm run verify

clean: ## Clean build artifacts and node_modules
	rm -rf .next node_modules .turbo

# Deployment targets
deploy-prod: ## Deploy to production (psra.sevensa.nl)
	@echo "Building production..."
	npm run build
	@echo "Deployment ready for psra.sevensa.nl"
	@echo "Run: docker build -t psra-ltsd:latest ."

deploy-demo: ## Deploy to demo (demo.psra.sevensa.nl)
	@echo "Building demo..."
	npm run build:demo
	@echo "Deployment ready for demo.psra.sevensa.nl"
	@echo "Run: docker build -t psra-ltsd-demo:latest ."

# Docker targets
docker-build: ## Build Docker image
	docker build -t psra-ltsd:latest .

docker-run: ## Run Docker container
	docker run -p 3000:3000 --env-file .env.local psra-ltsd:latest

docker-compose-up: ## Start all services with docker-compose
	docker-compose up -d

docker-compose-down: ## Stop all services
	docker-compose down

# VPS deployment
deploy-vps: ## Deploy both prod and demo to VPS
	@echo "🚀 Deploying to VPS..."
	ssh vncuser@psra.sevensa.nl 'cd /home/vncuser/psra-ltsd-enterprise-v2 && git pull && make install && make build && docker-compose up -d --build'
	@echo "✅ Deployment complete!"
	@echo "Production: https://psra.sevensa.nl"
	@echo "Demo: https://demo.psra.sevensa.nl"

# Health checks
health-check: ## Check health of deployed services
	@echo "Checking production..."
	@curl -f https://psra.sevensa.nl/api/health || echo "❌ Production health check failed"
	@echo "\nChecking demo..."
	@curl -f https://demo.psra.sevensa.nl/api/health || echo "❌ Demo health check failed"

# Logs
logs-prod: ## View production logs
	docker-compose logs -f psra-frontend

logs-demo: ## View demo logs
	docker-compose logs -f psra-demo-frontend

# Database
db-migrate: ## Run database migrations
	npx prisma migrate deploy

db-seed: ## Seed database
	npx prisma db seed

# Monitoring
monitor: ## Open monitoring dashboard
	@echo "Opening monitoring..."
	@open http://localhost:3000/admin/monitoring || xdg-open http://localhost:3000/admin/monitoring
