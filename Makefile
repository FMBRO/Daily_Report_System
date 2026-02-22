# ============================================================
# Daily Report System - Makefile
# ============================================================

# Project settings
PROJECT_ID := dailyreportsystem-487505
REGION := asia-northeast1
SERVICE_NAME := daily-report-api
IMAGE_NAME := gcr.io/$(PROJECT_ID)/$(SERVICE_NAME)

# Get current git commit hash for tagging
GIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")

# ============================================================
# Development
# ============================================================

.PHONY: install
install: ## Install dependencies
	npm install

.PHONY: dev
dev: ## Run development server
	npm run dev

.PHONY: lint
lint: ## Run ESLint
	npm run lint

.PHONY: lint-fix
lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

.PHONY: format
format: ## Run Prettier
	npm run format

.PHONY: typecheck
typecheck: ## Run TypeScript type check
	npm run typecheck

.PHONY: test
test: ## Run tests
	npm run test

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	npm run test:coverage

# ============================================================
# Database
# ============================================================

.PHONY: db-generate
db-generate: ## Generate Prisma Client
	npm run db:generate

.PHONY: db-migrate
db-migrate: ## Run database migrations
	npm run db:migrate

.PHONY: db-push
db-push: ## Push schema to database (dev)
	npm run db:push

.PHONY: db-studio
db-studio: ## Open Prisma Studio
	npm run db:studio

# ============================================================
# Build
# ============================================================

.PHONY: build
build: ## Build application
	npm run build

.PHONY: docker-build
docker-build: ## Build Docker image
	docker build -t $(IMAGE_NAME):$(GIT_HASH) -t $(IMAGE_NAME):latest .

.PHONY: docker-run
docker-run: ## Run Docker container locally
	docker run -p 8080:8080 --env-file .env $(IMAGE_NAME):latest

# ============================================================
# Deploy
# ============================================================

.PHONY: gcloud-auth
gcloud-auth: ## Configure Docker to use gcloud credentials
	gcloud auth configure-docker

.PHONY: docker-push
docker-push: ## Push Docker image to GCR
	docker push $(IMAGE_NAME):$(GIT_HASH)
	docker push $(IMAGE_NAME):latest

.PHONY: deploy
deploy: docker-build docker-push cloud-run-deploy ## Full deployment (build, push, deploy)

.PHONY: cloud-run-deploy
cloud-run-deploy: ## Deploy to Cloud Run
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):$(GIT_HASH) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--allow-unauthenticated \
		--set-env-vars "NODE_ENV=production"

.PHONY: cloud-run-deploy-with-db
cloud-run-deploy-with-db: ## Deploy to Cloud Run with database URL
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "Error: DATABASE_URL is not set"; \
		exit 1; \
	fi
	gcloud run deploy $(SERVICE_NAME) \
		--image $(IMAGE_NAME):$(GIT_HASH) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--allow-unauthenticated \
		--set-env-vars "NODE_ENV=production" \
		--set-secrets "DATABASE_URL=database-url:latest"

.PHONY: cloud-run-status
cloud-run-status: ## Show Cloud Run service status
	gcloud run services describe $(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID)

.PHONY: cloud-run-logs
cloud-run-logs: ## Show Cloud Run logs
	gcloud run services logs read $(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID) \
		--limit 100

.PHONY: cloud-run-delete
cloud-run-delete: ## Delete Cloud Run service
	gcloud run services delete $(SERVICE_NAME) \
		--platform managed \
		--region $(REGION) \
		--project $(PROJECT_ID)

# ============================================================
# CI/CD Helpers
# ============================================================

.PHONY: ci
ci: install lint typecheck test build ## Run full CI pipeline

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf dist node_modules/.cache coverage

# ============================================================
# Help
# ============================================================

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
