.PHONY: help dev test lint format clean build deploy

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment with Docker Compose
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose -f infrastructure/docker/docker-compose.dev.yml up --build; \
	elif docker compose version >/dev/null 2>&1; then \
		docker compose -f infrastructure/docker/docker-compose.dev.yml up --build; \
	else \
		echo "Error: Neither docker-compose nor 'docker compose' is installed. Please install Docker Desktop or docker-compose standalone."; \
		exit 1; \
	fi

test: ## Run all tests
	pytest tests/ -v --cov=zen_machine --cov-report=html

test-fast: ## Run tests without coverage
	pytest tests/ -v

lint: ## Run linting
	flake8 zen_machine/ tests/
	mypy zen_machine/

format: ## Format code
	black zen_machine/ tests/
	isort zen_machine/ tests/

clean: ## Clean build artifacts
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: ## Build Docker images
	docker build -t zen-machine:latest -f infrastructure/docker/Dockerfile .

deploy: ## Deploy to Kubernetes
	kubectl apply -f infrastructure/k8s/

install-hooks: ## Install pre-commit hooks
	pre-commit install

logs: ## View logs from development environment
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f; \
	elif docker compose version >/dev/null 2>&1; then \
		docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f; \
	else \
		echo "Error: Neither docker-compose nor 'docker compose' is installed."; \
		exit 1; \
	fi
