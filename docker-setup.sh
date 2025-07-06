#!/bin/bash

# Docker Setup Script for Attendance Management System
echo "🐳 Setting up Docker environment for Attendance Management..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment file
echo "📝 Setting up environment configuration..."
cp .env.docker .env

# Build and start containers
echo "🔨 Building Docker containers..."
docker-compose build --no-cache

echo "🚀 Starting MySQL container..."
docker-compose up -d mysql

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
sleep 15

echo "🔑 Generating application key..."
docker-compose exec backend php artisan key:generate

echo "📊 Running database migrations..."
docker-compose exec backend php artisan migrate:fresh --seed

echo "🌟 Starting all services..."
docker-compose up -d

echo ""
echo "✅ Setup complete! Your services are running on:"
echo "🌐 Laravel Application: http://localhost:8000"
echo "⚡ Vite Dev Server: http://localhost:5173"
echo "🗄️  phpMyAdmin: http://localhost:8080"
echo ""
echo "📋 Useful commands:"
echo "  Start all services: docker-compose up -d"
echo "  Stop all services: docker-compose down"
echo "  View logs: docker-compose logs -f"
echo "  Restart services: docker-compose restart"
echo ""
echo "🎉 Happy coding!"
