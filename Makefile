# Attendance Management - Docker Development Commands

.PHONY: help setup up down restart rebuild logs clean install shell migrate seed fresh

# Colors for better output
BLUE=\033[0;34m
GREEN=\033[0;32m
RED=\033[0;31m
YELLOW=\033[0;33m
NC=\033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)Attendance Management System - Docker Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "$(BLUE)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Initial setup - copies env file, builds containers, and runs migrations
	@echo "$(GREEN)🚀 Setting up Docker environment...$(NC)"
	@cp .env.docker .env
	@docker-compose build --no-cache
	@docker-compose up -d mysql
	@echo "$(YELLOW)⏳ Waiting for MySQL to be ready...$(NC)"
	@sleep 15
	@docker-compose exec backend php artisan key:generate
	@docker-compose exec backend php artisan migrate:fresh --seed
	@docker-compose up -d
	@echo "$(GREEN)✅ Setup complete!$(NC)"
	@make status

up: ## Start all services
	@echo "$(GREEN)🐳 Starting all Docker services...$(NC)"
	@docker-compose up -d
	@make status

down: ## Stop all services
	@echo "$(YELLOW)🛑 Stopping all Docker services...$(NC)"
	@docker-compose down

restart: ## Restart all services
	@echo "$(YELLOW)🔄 Restarting all Docker services...$(NC)"
	@docker-compose restart
	@make status

rebuild: ## Rebuild and restart all services
	@echo "$(YELLOW)🔨 Rebuilding all Docker services...$(NC)"
	@docker-compose down
	@docker-compose build --no-cache
	@docker-compose up -d
	@make status

logs: ## Show logs for all services
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-nginx: ## Show nginx logs
	@docker-compose logs -f nginx

logs-mysql: ## Show MySQL logs
	@docker-compose logs -f mysql

status: ## Show service status and URLs
	@echo ""
	@echo "$(GREEN)📋 Service Status:$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)🌐 Available URLs:$(NC)"
	@echo "$(BLUE)Laravel Application:$(NC) http://localhost:8000"
	@echo "$(BLUE)Vite Dev Server:$(NC)    http://localhost:5173"
	@echo "$(BLUE)phpMyAdmin:$(NC)         http://localhost:8080"
	@echo ""

shell: ## Access backend container shell
	@docker-compose exec backend sh

shell-frontend: ## Access frontend container shell
	@docker-compose exec frontend sh

mysql: ## Access MySQL CLI
	@docker-compose exec mysql mysql -u laravel -p attendance_management

migrate: ## Run database migrations
	@echo "$(GREEN)📊 Running database migrations...$(NC)"
	@docker-compose exec backend php artisan migrate

migrate-fresh: ## Fresh migrations with seeding
	@echo "$(YELLOW)🗑️  Running fresh migrations with seeding...$(NC)"
	@docker-compose exec backend php artisan migrate:fresh --seed

seed: ## Run database seeders
	@echo "$(GREEN)🌱 Running database seeders...$(NC)"
	@docker-compose exec backend php artisan db:seed

install: ## Install dependencies
	@echo "$(GREEN)📦 Installing PHP dependencies...$(NC)"
	@docker-compose exec backend composer install
	@echo "$(GREEN)📦 Installing Node.js dependencies...$(NC)"
	@docker-compose exec frontend npm install

clear-cache: ## Clear all Laravel caches
	@echo "$(GREEN)🧹 Clearing Laravel caches...$(NC)"
	@docker-compose exec backend php artisan cache:clear
	@docker-compose exec backend php artisan config:clear
	@docker-compose exec backend php artisan view:clear
	@docker-compose exec backend php artisan route:clear

fresh: ## Complete fresh start (danger: deletes all data)
	@echo "$(RED)⚠️  This will delete all data! Press Ctrl+C to cancel...$(NC)"
	@sleep 5
	@docker-compose down -v
	@docker system prune -f
	@make setup

clean: ## Clean up Docker resources
	@echo "$(YELLOW)🧹 Cleaning up Docker resources...$(NC)"
	@docker-compose down
	@docker system prune -f

test: ## Run tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	@docker-compose exec backend php artisan test

artisan: ## Run artisan command (usage: make artisan cmd="migrate")
	@docker-compose exec backend php artisan $(cmd)

npm: ## Run npm command (usage: make npm cmd="install package-name")
	@docker-compose exec frontend npm $(cmd)

composer: ## Run composer command (usage: make composer cmd="require package-name")
	@docker-compose exec backend composer $(cmd)
