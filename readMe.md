# 🎓 Attendance Management System

Modern web application built with Laravel 12 and React for managing class attendance with QR code functionality. This system allows teachers to create and manage classes, generate QR codes for attendance tracking, and provides students with an easy way to mark their attendance using mobile devices.

## 🚀 Quick Start

**New to the project? Start here!**

```bash
# 1. Clone and navigate
git clone https://github.com/snlt11/Attendance-Management.git
cd Attendance-Management

# 2. One-command setup with Docker
npm install && npm run docker:setup

# 3. Open your browser
# 🌐 Application: http://localhost
# ⚡ Development: http://localhost:5173
```

**Login with**: admin@example.com / password

---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start with Docker](#quick-start-with-docker)
- [Docker Development Workflow](#docker-development-workflow)
- [Manual Setup (Advanced)](#manual-setup-advanced)
- [Database Setup](#database-setup)
- [Development](#development)
- [Project Structure](#project-structure)
- [Key Functionalities](#key-functionalities)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### For Teachers

- **Class Management**: Create, edit, and delete classes with detailed information
- **Multiple Schedules**: Support for multiple time slots per class (e.g., Mon-Fri, weekends)
- **Student Enrollment**: Add/remove students from classes
- **QR Code Generation**: Generate time-limited QR codes for attendance (5-minute expiry with auto-regeneration)
- **Real-time Attendance**: Monitor student attendance in real-time
- **Location-based Check-in**: Ensure students are physically present at class location
- **Class Code Generation**: Generate unique registration codes for student self-enrollment

### For Students

- **QR Code Scanning**: Quick attendance marking using mobile camera
- **Location Verification**: Automatic location verification (within 100 meters of class location)
- **Class Enrollment**: Join classes using registration codes
- **Attendance History**: View personal attendance records

### General Features

- **Responsive Design**: Modern UI that works on desktop and mobile devices
- **Real-time Updates**: Live updates for QR codes and attendance status
- **Role-based Access**: Different interfaces for teachers and students
- **Search & Filter**: Advanced search and filtering capabilities
- **Dark/Light Mode**: Theme switching support
- **Multi-timezone Support**: Configurable timezone support (default: Asia/Yangon)

## 🛠 Technology Stack

### Backend

- **Laravel 12** - PHP framework
- **PHP 8.2+** - Server-side language
- **MySQL 8.0** - Database
- **Inertia.js** - Modern monolith architecture
- **Laravel Sanctum** - API authentication

### Frontend

- **React 19** - JavaScript library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Date Picker** - Date and time selection
- **QR Code Canvas** - QR code generation
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications

### Development & DevOps

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Pest** - PHP testing framework

## � Quick Start with Docker

**Docker is the recommended and easiest way to run this project.** It provides a consistent development environment across all platforms and handles all dependencies automatically.

### Prerequisites

- **Docker** and **Docker Compose** installed on your system
    - [Install Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac)
    - [Install Docker Engine](https://docs.docker.com/engine/install/) (Linux)
- **Node.js 18+** (for running npm scripts only)

### One-Command Setup

Get the entire application running in under 5 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/snlt11/Attendance-Management.git
cd Attendance-Management

# 2. Install Node.js dependencies (required for Docker scripts)
npm install

# 3. Start the complete application with Docker
npm run docker:setup
```

**That's it!** The `docker:setup` command automatically:

- 📋 Copies Docker environment configuration
- 🐳 Pulls and starts MySQL container
- 🔧 Builds and starts Laravel application container
- 🔑 Generates application key
- 🗄️ Runs database migrations with sample data
- ⚡ Starts frontend development server with hot reload
- ✅ Makes the application ready to use

### Access Your Application

After the setup completes, you can access:

- **🌐 Web Application**: http://localhost
- **⚡ Frontend Dev Server**: http://localhost:5173 (with hot reload)
- **🗄️ Database**: localhost:3306 (user: laravel, password: laravel)

### Default Login Credentials

The system comes with pre-configured accounts:

- **👨‍💼 Admin**: admin@example.com / password
- **👩‍🏫 Teacher**: teacher1@example.com / password
- **👨‍🎓 Student**: student1@example.com / password

### Daily Development Commands

```bash
# 🚀 Start development environment (most common)
npm run docker:dev

# 🔍 View application logs
npm run docker:logs

# 🔄 Restart all containers
npm run docker:restart

# 🛑 Stop all containers
npm run docker:stop

# 🔨 Rebuild containers (when dependencies change)
npm run docker:rebuild
```

## 🐳 Docker Development Workflow

This section provides comprehensive information about developing with Docker, including advanced usage and troubleshooting.

### Docker Architecture

The Docker setup includes these optimized services:

- **🚀 Laravel Application**: Main backend server (PHP 8.2 + Laravel 12)
- **⚡ Vite Dev Server**: Frontend with hot reload (React + TypeScript)
- **🗄️ MySQL Database**: Persistent data storage
- **🌐 Nginx**: Web server and reverse proxy
- **📧 Mailhog**: Email testing (optional)

### Development Workflow

#### Starting Your Development Session

```bash
# Quick start (most common)
npm run docker:dev

# Or start with logs visible
npm run docker:dev && npm run docker:logs
```

#### Making Changes During Development

1. **Backend Changes (PHP/Laravel)**

    - Edit files in `app/`, `routes/`, `config/`, etc.
    - Changes are reflected immediately (volume mounted)
    - No restart needed for most changes

2. **Frontend Changes (React/TypeScript)**

    - Edit files in `resources/js/`
    - Hot reload automatically refreshes browser
    - TypeScript compilation happens instantly

3. **Database Changes**

    ```bash
    # Create new migration
    docker-compose exec backend php artisan make:migration create_example_table

    # Run migrations
    docker-compose exec backend php artisan migrate

    # Fresh migration with seeders
    docker-compose exec backend php artisan migrate:fresh --seed
    ```

4. **Installing New Dependencies**

    ```bash
    # PHP dependencies
    docker-compose exec backend composer require package/name

    # Node.js dependencies (run outside container)
    npm install package-name

    # Rebuild containers after major dependency changes
    npm run docker:rebuild
    ```

#### Useful Development Commands

```bash
# Execute Laravel commands
docker-compose exec backend php artisan tinker
docker-compose exec backend php artisan route:list
docker-compose exec backend php artisan queue:work

# Database operations
docker-compose exec backend php artisan migrate:status
docker-compose exec mysql mysql -u laravel -p attendance_management

# View real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Container management
docker-compose ps                    # Show running containers
docker-compose exec backend bash    # Shell into backend container
```

### Docker Environment Configuration

The project uses Docker-specific environment files:

- **`.env.docker`** - Template for Docker environment
- **`docker-compose.yml`** - Development containers
- **`docker-compose.prod.yml`** - Production deployment

### Advanced Docker Usage

#### Custom Docker Commands

```bash
# Build specific service
docker-compose build backend

# Start specific service
docker-compose up -d mysql

# Scale services (if needed)
docker-compose up -d --scale backend=2

# Remove all containers and volumes
docker-compose down -v
```

#### Performance Optimization

```bash
# Clear Docker system cache
docker system prune

# Rebuild with no cache
docker-compose build --no-cache

# Optimize for macOS (if using Docker Desktop)
# Add to docker-compose.yml volumes:
# - ./:/var/www/html:cached
```

### Docker Troubleshooting

#### Common Issues and Solutions

1. **Port Already in Use**

    ```bash
    # Check what's using the port
    lsof -i :80      # Web server
    lsof -i :3306    # MySQL
    lsof -i :5173    # Vite dev server

    # Kill process using port
    sudo kill -9 $(lsof -t -i:80)
    ```

2. **Containers Won't Start**

    ```bash
    # Check detailed logs
    npm run docker:logs

    # Rebuild everything
    npm run docker:rebuild

    # Reset Docker environment
    docker-compose down -v
    docker system prune
    npm run docker:setup
    ```

3. **Database Connection Issues**

    ```bash
    # Verify MySQL container is running
    docker-compose ps

    # Check database logs
    docker-compose logs mysql

    # Reset database
    docker-compose exec backend php artisan migrate:fresh --seed
    ```

4. **File Permission Issues (Linux/macOS)**

    ```bash
    # Fix Laravel permissions
    docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
    docker-compose exec backend chmod -R 775 storage bootstrap/cache
    ```

5. **Hot Reload Not Working**

    ```bash
    # Restart Vite dev server
    docker-compose restart frontend

    # Or rebuild frontend container
    docker-compose build frontend
    docker-compose up -d frontend
    ```

6. **Memory Issues**

    ```bash
    # Increase Docker memory allocation (Docker Desktop)
    # Go to: Docker Desktop > Settings > Resources > Memory
    # Recommended: 4GB minimum, 8GB optimal

    # Clean up Docker resources
    docker system prune -a
    ```

#### Getting Help

```bash
# Check container health
docker-compose ps

# View resource usage
docker stats

# Inspect specific container
docker-compose exec backend php artisan about
```

### Production Deployment with Docker

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs
```

## 📖 Manual Setup (Advanced)

> **Note**: Docker setup is recommended for most users. Use manual setup only if you need specific local configurations or are contributing to the Docker setup itself.

### Prerequisites for Manual Setup

- **PHP 8.2 or higher** with extensions: mysqli, pdo_mysql, mbstring, xml, ctype, json, bcmath, zip
- **Composer** (PHP dependency manager)
- **Node.js 18+ and npm/yarn**
- **MySQL 8.0** or compatible database server

### Manual Installation Steps

1. **Clone and navigate to the repository**

    ```bash
    git clone https://github.com/snlt11/Attendance-Management.git
    cd Attendance-Management
    ```

2. **Install PHP dependencies**

    ```bash
    composer install
    ```

3. **Install JavaScript dependencies**

    ```bash
    npm install
    ```

4. **Environment configuration**

    ```bash
    cp .env.example .env
    php artisan key:generate
    ```

5. **Configure your database**

    Create a MySQL database and update `.env`:

    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=attendance_management
    DB_USERNAME=your_username
    DB_PASSWORD=your_password
    ```

6. **Run database migrations and seeders**

    ```bash
    php artisan migrate:fresh --seed
    ```

7. **Build frontend assets**

    ```bash
    npm run build
    ```

8. **Start development servers**

    ```bash
    # Terminal 1: Laravel backend
    php artisan serve

    # Terminal 2: Frontend dev server
    npm run dev
    ```

### Manual Development Workflow

```bash
# Start development (2 terminals needed)
php artisan serve    # Terminal 1: Backend
npm run dev         # Terminal 2: Frontend

# Common development tasks
php artisan migrate              # Run migrations
php artisan tinker              # Laravel REPL
php artisan route:list          # List all routes
composer require package/name   # Install PHP package
npm install package-name        # Install Node package
```

## 🗄 Database Setup

The application includes comprehensive database seeders with sample data:

### Default Users Created:

- **Admin**: admin@example.com / password
- **Teachers**: teacher1@example.com, teacher2@example.com, etc. / password
- **Students**: student1@example.com, student2@example.com, etc. / password

### Sample Data Includes:

- 10 subjects (Math, Physics, Chemistry, etc.)
- 10 locations with GPS coordinates
- 10 classes with various schedules
- Student enrollments (10+ students per class)
- Class schedules (Monday-Friday for regular classes, multiple sessions for weekend classes)

## 💻 Development

## 💻 Development

### Recommended: Docker Development

**Docker is the preferred development method** as it provides consistency across all environments and handles all dependencies automatically.

#### Docker Development Commands

```bash
# 🚀 Start complete development environment
npm run docker:dev

# 🔍 View application logs in real-time
npm run docker:logs

# 🔄 Restart all services
npm run docker:restart

# 🛑 Stop all services
npm run docker:stop

# 🔨 Rebuild containers (when dependencies change)
npm run docker:rebuild

# 🏗️ Complete setup from scratch
npm run docker:setup
```

#### Docker Development Workflow

1. **Daily Development Session**

    ```bash
    # Start your day
    npm run docker:dev

    # Make changes to PHP/React files
    # Changes are automatically reflected

    # End your day
    npm run docker:stop
    ```

2. **Backend Development (Laravel/PHP)**

    - Edit files in `app/`, `routes/`, `config/`, etc.
    - Changes are live-reloaded (volume mounted)
    - Run Laravel commands:
        ```bash
        docker-compose exec backend php artisan migrate
        docker-compose exec backend php artisan tinker
        docker-compose exec backend composer require package/name
        ```

3. **Frontend Development (React/TypeScript)**

    - Edit files in `resources/js/`
    - Hot reload automatically updates browser
    - Install packages normally: `npm install package-name`

4. **Database Operations**

    ```bash
    # Run migrations
    docker-compose exec backend php artisan migrate

    # Seed database
    docker-compose exec backend php artisan db:seed

    # Access database
    docker-compose exec mysql mysql -u laravel -p attendance_management
    ```

### Alternative: Manual Development

Use this only if Docker is not available or for specific development needs.

#### Manual Development Commands

```bash
# Frontend Development
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run build:ssr       # Build with SSR support

# Code Quality
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run types           # Check TypeScript types

# Laravel Commands
php artisan serve       # Start Laravel development server
php artisan test        # Run PHP tests
php artisan migrate     # Run migrations
php artisan tinker      # Laravel REPL
```

#### Manual Development Workflow

1. **Start development environment (2 terminals)**

    ```bash
    # Terminal 1: Laravel backend
    php artisan serve

    # Terminal 2: Frontend development
    npm run dev
    ```

2. **Making changes**
    - Backend: Edit PHP files in `app/`, `routes/`, etc.
    - Frontend: Edit React/TypeScript files in `resources/js/`
    - Database: Create migrations with `php artisan make:migration`

### Code Quality & Testing

```bash
# Docker environment
docker-compose exec backend php artisan test        # Run PHP tests
npm run lint                                        # Check JavaScript/TypeScript
npm run format                                      # Auto-format code

# Manual environment
php artisan test        # Run PHP tests
npm run lint           # Check code quality
npm run format         # Auto-format code
```

### Available Scripts

| Script                   | Description                          | Environment |
| ------------------------ | ------------------------------------ | ----------- |
| `npm run docker:setup`   | Complete Docker setup from scratch   | Docker      |
| `npm run docker:dev`     | Start Docker development environment | Docker      |
| `npm run docker:stop`    | Stop all Docker containers           | Docker      |
| `npm run docker:restart` | Restart Docker containers            | Docker      |
| `npm run docker:rebuild` | Rebuild Docker containers            | Docker      |
| `npm run docker:logs`    | View Docker container logs           | Docker      |
| `npm run dev`            | Start Vite dev server                | Manual      |
| `npm run build`          | Build production assets              | Both        |
| `npm run lint`           | Run ESLint                           | Both        |
| `npm run format`         | Format code with Prettier            | Both        |
| `php artisan serve`      | Start Laravel server                 | Manual      |
| `php artisan test`       | Run PHP tests                        | Manual      |

## 🏗 Project Structure

```
attendance-management/
├── app/
│   ├── Http/Controllers/
│   │   ├── ClassController.php       # Class management
│   │   ├── UserController.php        # User management
│   │   └── Auth/Api/
│   │       └── AttendanceController.php # QR attendance
│   ├── Models/
│   │   ├── ClassModel.php           # Class entity
│   │   ├── ClassSchedule.php        # Class scheduling
│   │   ├── ClassSession.php         # Individual sessions
│   │   ├── Attendance.php           # Attendance records
│   │   ├── User.php                 # Users (teachers/students)
│   │   ├── Subject.php              # Academic subjects
│   │   └── Location.php             # Physical locations
│   └── Helpers/
│       └── Helper.php               # Utility functions
├── database/
│   ├── migrations/                  # Database schema
│   ├── seeders/                     # Sample data
│   └── factories/                   # Model factories
├── resources/
│   ├── js/
│   │   ├── pages/
│   │   │   ├── classes.tsx          # Class management UI
│   │   │   ├── dashboard.tsx        # Dashboard
│   │   │   └── users.tsx            # User management
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx        # Main layout
│   │   └── components/              # Reusable components
│   └── css/                         # Stylesheets
├── routes/
│   ├── web.php                      # Web routes
│   └── api.php                      # API routes
├── docker/                          # Docker configuration
├── docker-compose.yml               # Docker Compose setup
├── package.json                     # Node.js dependencies
├── composer.json                    # PHP dependencies
└── .env.example                     # Environment template
```

## 🔧 Key Functionalities

### Class Management

- **CRUD Operations**: Create, read, update, delete classes
- **Flexible Scheduling**: Multiple time slots per week
- **Student Management**: Add/remove students from classes
- **Conflict Detection**: Prevent teacher schedule conflicts

### QR Code Attendance System

- **Dynamic QR Generation**: Time-limited QR codes (5-minute expiry)
- **Auto-regeneration**: Automatic QR refresh when expired
- **Location Verification**: GPS-based attendance verification (100m radius)
- **Real-time Updates**: Live countdown timers and status updates

### Student Enrollment

- **Registration Codes**: Unique codes for self-enrollment
- **Bulk Management**: Add/remove multiple students
- **Availability Search**: Search for unEnrolled students

### Location-based Features

- **GPS Coordinates**: Store precise location data for each class
- **Distance Calculation**: Haversine formula for location verification
- **Mobile Integration**: Access device location for attendance

## 🌐 API Endpoints

### Class Management

```
GET    /classes                     # List all classes
POST   /classes                     # Create new class
PUT    /classes/{id}                # Update class
DELETE /classes/{id}                # Delete class
```

### Student Management

```
GET    /classes/{id}/students       # Get class students
POST   /classes/{id}/students       # Add student to class
DELETE /classes/{id}/students/{userId} # Remove student
GET    /classes/{id}/students/search   # Search available students
```

### QR Code & Attendance

```
POST   /classes/{id}/generate-qr    # Generate QR code
POST   /attendance                  # Mark attendance via QR
```

### Authentication

```
POST   /login                       # User login
POST   /logout                      # User logout
POST   /register                    # User registration
```

## 🔒 Security Features

- **Role-based Access Control**: Different permissions for teachers/students
- **CSRF Protection**: Laravel's built-in CSRF protection
- **Input Validation**: Comprehensive request validation
- **Location Verification**: GPS-based attendance validation
- **Time-limited QR Codes**: Prevents QR code reuse
- **Database Transactions**: Ensures data consistency

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test tests/Feature/ClassControllerTest.php

# Run with coverage
php artisan test --coverage
```

## 🚀 Deployment

## 🚀 Deployment

### Docker Production Deployment (Recommended)

The project includes production-ready Docker configurations for easy deployment.

#### Quick Production Deployment

```bash
# 1. Clone repository on production server
git clone https://github.com/snlt11/Attendance-Management.git
cd Attendance-Management

# 2. Build and deploy with Docker
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Run initial setup
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force
docker-compose -f docker-compose.prod.yml exec backend php artisan key:generate
```

#### Production Environment Setup

1. **Environment Configuration**

    ```bash
    # Copy and configure production environment
    cp .env.example .env.production

    # Edit with production settings:
    # - Set APP_ENV=production
    # - Configure database credentials
    # - Set secure APP_KEY
    # - Configure mail settings
    ```

2. **SSL/HTTPS Setup**

    ```bash
    # Update docker-compose.prod.yml for SSL
    # Add SSL certificates to nginx configuration
    # Configure domain name and HTTPS redirects
    ```

3. **Database Migration**

    ```bash
    # Run production migrations
    docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force

    # Optimize Laravel for production
    docker-compose -f docker-compose.prod.yml exec backend php artisan config:cache
    docker-compose -f docker-compose.prod.yml exec backend php artisan route:cache
    docker-compose -f docker-compose.prod.yml exec backend php artisan view:cache
    ```

#### Production Monitoring

```bash
# View production logs
docker-compose -f docker-compose.prod.yml logs

# Monitor container health
docker-compose -f docker-compose.prod.yml ps

# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### Manual Production Build

For traditional hosting environments:

1. **Install dependencies**

    ```bash
    composer install --optimize-autoloader --no-dev
    npm ci
    ```

2. **Build assets**

    ```bash
    npm run build
    ```

3. **Configure environment**

    ```bash
    cp .env.example .env
    # Edit .env with production settings
    php artisan key:generate
    ```

4. **Database setup**

    ```bash
    php artisan migrate --force
    ```

5. **Optimize Laravel**

    ```bash
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan storage:link
    ```

6. **Set file permissions**
    ```bash
    chmod -R 755 storage
    chmod -R 755 bootstrap/cache
    ```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
    ```bash
    git checkout -b feature/amazing-feature
    ```
3. **Make your changes**
4. **Run tests and linting**
    ```bash
    npm run lint
    npm run format
    php artisan test
    ```
5. **Commit your changes**
    ```bash
    git commit -m 'Add some amazing feature'
    ```
6. **Push to the branch**
    ```bash
    git push origin feature/amazing-feature
    ```
7. **Open a Pull Request**

### Development Guidelines

- Follow PSR-12 coding standards for PHP
- Use TypeScript for all new React components
- Write tests for new features
- Update documentation for significant changes
- Use conventional commit messages

## 📝 Environment Variables

Key environment variables to configure:

```env
# Application
APP_NAME="Attendance Management"
APP_ENV=local
APP_URL=http://localhost

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=attendance_management
DB_USERNAME=laravel
DB_PASSWORD=laravel

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database

# Mail (for notifications)
MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025

# Queue (for background jobs)
QUEUE_CONNECTION=database
```

## 🛠 Troubleshooting

## 🛠 Troubleshooting

### Docker-Related Issues (Most Common)

#### Container Issues

1. **Containers won't start**

    ```bash
    # Check container status
    docker-compose ps

    # View detailed logs
    npm run docker:logs

    # Clean restart
    npm run docker:stop
    npm run docker:rebuild
    ```

2. **Port already in use**

    ```bash
    # Check what's using the ports
    lsof -i :80      # Web server
    lsof -i :3306    # MySQL
    lsof -i :5173    # Vite dev server

    # Kill processes using the ports
    sudo kill -9 $(lsof -t -i:80)
    sudo kill -9 $(lsof -t -i:3306)
    sudo kill -9 $(lsof -t -i:5173)
    ```

3. **Database connection failed**

    ```bash
    # Check MySQL container
    docker-compose logs mysql

    # Restart database
    docker-compose restart mysql

    # Reset database completely
    docker-compose exec backend php artisan migrate:fresh --seed
    ```

4. **File permission issues (Linux/macOS)**

    ```bash
    # Fix Laravel permissions
    docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache
    docker-compose exec backend chmod -R 775 storage bootstrap/cache
    ```

5. **Hot reload not working**

    ```bash
    # Restart frontend container
    docker-compose restart frontend

    # Check Vite configuration
    docker-compose logs frontend
    ```

#### Docker Performance Issues

1. **Slow performance on macOS**

    ```bash
    # Add to volumes in docker-compose.yml:
    # - ./:/var/www/html:cached

    # Increase Docker Desktop resources:
    # Docker Desktop > Settings > Resources
    # Memory: 4GB minimum, 8GB recommended
    ```

2. **Out of disk space**

    ```bash
    # Clean Docker system
    docker system prune -a

    # Remove unused volumes
    docker volume prune
    ```

### Application Issues

1. **Laravel Application Errors**

    ```bash
    # Clear Laravel caches
    docker-compose exec backend php artisan config:clear
    docker-compose exec backend php artisan cache:clear
    docker-compose exec backend php artisan view:clear

    # Check Laravel logs
    docker-compose exec backend tail -f storage/logs/laravel.log
    ```

2. **Frontend Build Errors**

    ```bash
    # Clear node modules and reinstall
    rm -rf node_modules package-lock.json
    npm install

    # Rebuild frontend container
    docker-compose build frontend
    ```

3. **Database Migration Issues**

    ```bash
    # Check migration status
    docker-compose exec backend php artisan migrate:status

    # Rollback and retry
    docker-compose exec backend php artisan migrate:rollback
    docker-compose exec backend php artisan migrate

    # Fresh start with seed data
    docker-compose exec backend php artisan migrate:fresh --seed
    ```

### QR Code & Location Issues

1. **QR Code not generating**

    - Check browser console for JavaScript errors
    - Ensure class has valid location coordinates
    - Verify class is active and has schedules

2. **Location detection not working**

    - Enable location services in browser
    - Use HTTPS in production (required for geolocation)
    - Check GPS coordinates are properly set for class location

3. **Attendance marking fails**
    - Verify student is enrolled in the class
    - Check if student is within 100m of class location
    - Ensure QR code hasn't expired (5-minute limit)

### Manual Setup Issues

1. **PHP dependency conflicts**

    ```bash
    # Clear composer cache
    composer clear-cache
    composer install --no-cache
    ```

2. **Node.js version issues**

    ```bash
    # Check Node.js version (requires 18+)
    node --version

    # Install correct version using nvm
    nvm install 18
    nvm use 18
    ```

3. **MySQL connection issues**

    ```bash
    # Test database connection
    mysql -h 127.0.0.1 -u laravel -p attendance_management

    # Check MySQL service
    sudo systemctl status mysql    # Linux
    brew services list mysql       # macOS
    ```

### Getting Help

If you're still experiencing issues:

1. **Check the logs first**

    ```bash
    npm run docker:logs
    ```

2. **Search existing GitHub issues**

    - Visit the project's GitHub Issues page
    - Search for similar problems

3. **Create a detailed issue report**

    - Include your operating system
    - Include Docker version (`docker --version`)
    - Include the exact error message
    - Include steps to reproduce the problem

4. **Join the community**
    - Check the project's discussions section
    - Ask questions with detailed context

### Common Error Messages

| Error                           | Solution                                                               |
| ------------------------------- | ---------------------------------------------------------------------- |
| "Port 80 is already in use"     | Stop Apache/Nginx: `sudo systemctl stop apache2 nginx`                 |
| "MySQL connection refused"      | Restart MySQL container: `docker-compose restart mysql`                |
| "Permission denied"             | Fix file permissions (see File permission issues above)                |
| "Vite build failed"             | Clear node_modules and reinstall: `rm -rf node_modules && npm install` |
| "Class not found"               | Run `docker-compose exec backend composer dump-autoload`               |
| "No application encryption key" | Run `docker-compose exec backend php artisan key:generate`             |

## 📱 Mobile Compatibility

The application is fully responsive and optimized for mobile devices:

- **Touch-friendly Interface**: Large buttons and touch targets
- **Mobile QR Scanner**: Camera integration for QR code scanning
- **Responsive Design**: Adapts to different screen sizes
- **GPS Integration**: Device location access for attendance
- **Offline Capability**: Basic functionality works offline

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sainay Lin Thar**

- GitHub: [@snlt11](https://github.com/snlt11)
- Project Link: [https://github.com/snlt11/Attendance-Management](https://github.com/snlt11/Attendance-Management)

## 🙏 Acknowledgments

- Laravel team for the amazing framework
- React team for the powerful frontend library
- Tailwind CSS for the utility-first CSS framework
- All contributors who helped improve this project

---

## 📞 Support

If you encounter any issues or have questions:

### Docker Issues (Most Common)

1. **Start with Docker logs**

    ```bash
    npm run docker:logs
    ```

2. **Try a clean rebuild**

    ```bash
    npm run docker:stop
    npm run docker:rebuild
    ```

3. **Check our [Docker Troubleshooting](#docker-related-issues-most-common)** section above

### Getting Additional Help

1. **📖 Check the documentation** above
2. **🔍 Search existing issues** on GitHub
3. **🐛 Create a new issue** with detailed information:
    - Your operating system
    - Docker version (`docker --version`)
    - Exact error message
    - Steps to reproduce
4. **💬 Join the discussion** in the project's discussions section

### Community & Resources

- **🐳 Docker Documentation**: [Official Docker Docs](https://docs.docker.com/)
- **📖 Laravel Documentation**: [Laravel 12 Docs](https://laravel.com/docs)
- **⚛️ React Documentation**: [React 19 Docs](https://react.dev/)
- **🎯 Inertia.js Guide**: [Inertia.js Docs](https://inertiajs.com/)

**Happy coding! 🎉**

### 🌟 Why Docker?

This project uses **Docker as the primary development method** because it:

- ✅ **Works everywhere** - Same environment on Windows, macOS, and Linux
- ✅ **Zero configuration** - No need to install PHP, MySQL, or configure web servers
- ✅ **Instant setup** - One command gets everything running
- ✅ **Consistent dependencies** - Everyone uses the same versions
- ✅ **Easy collaboration** - New developers can start in minutes
- ✅ **Production-ready** - Same containers work in development and production

> **💡 Pro tip**: Even if you're new to Docker, our setup is designed to be beginner-friendly. You'll be productive immediately!
