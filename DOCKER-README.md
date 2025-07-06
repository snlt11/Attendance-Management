# Attendance Management System - Docker Setup

This project has been configured to run entirely in Docker containers, providing a consistent development environment across Windows, macOS, and Linux.

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

### One-Command Setup

```bash
./docker-setup.sh
```

Or using Composer:

```bash
composer run docker:setup
```

## 🐳 Services

The Docker setup includes the following services:

| Service        | Port | Description                            |
| -------------- | ---- | -------------------------------------- |
| **nginx**      | 8000 | Web server serving Laravel application |
| **frontend**   | 5173 | Vite development server with HMR       |
| **backend**    | 9000 | PHP-FPM backend for Laravel            |
| **mysql**      | 3306 | MySQL 8.0 database                     |
| **phpmyadmin** | 8080 | Database management interface          |

## 📋 Available Commands

### Composer Scripts

```bash
# Start development environment (Docker)
composer run docker:dev

# Stop all containers
composer run docker:stop

# Restart all containers
composer run docker:restart

# Rebuild containers from scratch
composer run docker:rebuild

# View container logs
composer run docker:logs

# Complete setup (copy env, migrate, seed)
composer run docker:setup
```

### Direct Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend

# Execute commands in backend container
docker-compose exec backend php artisan migrate
docker-compose exec backend php artisan tinker

# Rebuild specific service
docker-compose build backend

# Scale containers if needed
docker-compose up -d --scale backend=2
```

## 🔧 Configuration

### Environment Files

- `.env.docker` - Docker-optimized environment configuration
- `.env.example` - Original Laravel environment template

### Key Configuration Changes

- Database changed from SQLite to MySQL
- Database host set to `mysql` (Docker service name)
- Vite configured for Docker networking
- File permissions optimized for containers

### Port Mapping

- **Laravel**: `localhost:8000` → `nginx:80`
- **Vite**: `localhost:5173` → `frontend:5173`
- **phpMyAdmin**: `localhost:8080` → `phpmyadmin:80`
- **MySQL**: `localhost:3306` → `mysql:3306`

## 📁 Project Structure

```
.
├── docker-compose.yml          # Main Docker orchestration
├── Dockerfile                  # Multi-stage build configuration
├── docker-setup.sh            # Automated setup script
├── .env.docker                # Docker environment configuration
├── nginx/                     # NGINX configuration
│   ├── nginx.conf
│   └── conf.d/default.conf
├── php/                       # PHP configuration
│   └── local.ini
└── mysql/                     # MySQL configuration
    └── my.cnf
```

## 🗄️ Database

### Connection Details

- **Host**: `mysql` (within Docker network) or `localhost` (from host)
- **Port**: `3306`
- **Database**: `attendance_management`
- **Username**: `laravel`
- **Password**: `laravel`
- **Root Password**: `root`

### phpMyAdmin Access

Visit `http://localhost:8080` and login with:

- **Server**: `mysql`
- **Username**: `laravel`
- **Password**: `laravel`

## 🛠️ Development Workflow

### Starting Development

1. Run `./docker-setup.sh` or `composer run docker:setup`
2. Visit `http://localhost:8000` for the Laravel application
3. Visit `http://localhost:5173` for Vite dev server (with HMR)
4. Visit `http://localhost:8080` for phpMyAdmin

### Making Changes

- **Backend changes**: Automatically reflected (mounted volumes)
- **Frontend changes**: Hot Module Replacement via Vite
- **Database changes**: Use `docker-compose exec backend php artisan migrate`

### Common Tasks

```bash
# Run migrations
docker-compose exec backend php artisan migrate

# Seed database
docker-compose exec backend php artisan db:seed

# Clear caches
docker-compose exec backend php artisan cache:clear
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan view:clear

# Install new packages
docker-compose exec backend composer install
docker-compose exec frontend npm install

# Generate IDE helper files
docker-compose exec backend php artisan ide-helper:generate
```

## 🐛 Troubleshooting

### Containers won't start

```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Restart problematic service
docker-compose restart [service-name]
```

### Database connection issues

```bash
# Verify MySQL is running
docker-compose exec mysql mysql -u laravel -p -e "SELECT 1"

# Reset database
docker-compose exec backend php artisan migrate:fresh --seed
```

### Permission issues

```bash
# Fix storage permissions
docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
docker-compose exec backend chmod -R 775 storage bootstrap/cache
```

### Vite HMR not working

- Ensure ports 5173 is not blocked by firewall
- Check that Vite service is running: `docker-compose logs frontend`
- Verify browser is accessing `http://localhost:5173`

### Complete reset

```bash
# Stop and remove everything
docker-compose down -v
docker system prune -f

# Rebuild from scratch
composer run docker:rebuild
```

## 🔄 Migration from SQLite

This setup automatically handles the migration from SQLite to MySQL. The key changes:

1. **Database configuration**: Updated in `.env.docker`
2. **Service dependencies**: Containers wait for MySQL to be ready
3. **Volume management**: Persistent MySQL data storage
4. **Network isolation**: All services communicate via Docker network

## 📦 Production Considerations

For production deployment:

1. Use multi-stage builds to optimize image sizes
2. Configure proper SSL/TLS certificates
3. Set up external MySQL service or cluster
4. Use production-optimized PHP-FPM and NGINX configurations
5. Implement proper backup strategies
6. Configure monitoring and logging

## 🤝 Contributing

When contributing to this project:

1. Test changes in the Docker environment
2. Update documentation if configuration changes
3. Ensure all services start successfully
4. Verify database migrations work correctly

## 📝 License

This project maintains the same license as the original Laravel application.
