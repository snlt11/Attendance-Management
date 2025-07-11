# Attendance Management - Local Development Setup

This guide explains how to run the **Attendance Management** project with **Laravel 12 + Inertia + React** using **local development** with **SQLite** database and **Composer scripts**.

## 🚀 Requirements

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- No Docker required!

---

## 📦 Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/snlt11/Attendance-Management.git
cd Attendance-Management
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install Node.js dependencies

```bash
npm install
```

### 4. Environment Configuration

The project is already configured with SQLite. The `.env` file contains:

```env
# Database Configuration (SQLite)
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# App Configuration
APP_NAME="Attendance Management"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
```

### 5. Generate Application Key

```bash
php artisan key:generate
```

### 6. Create and Setup Database

The SQLite database file is already created. Run migrations:

```bash
php artisan migrate
```

Optional: Seed the database with sample data:

```bash
php artisan db:seed
```

---

## 🚀 Running the Application

### Start Development Server

Simply run:

```bash
composer run dev
```

This single command will:

- Start Laravel development server on `http://localhost:8000`
- Start Vite development server with Hot Module Replacement (HMR)
- Display both servers with colored output for easy monitoring
- Automatically restart if either server fails

### Alternative Commands

You can also run servers separately:

```bash
# Laravel server only
php artisan serve

# Vite dev server only (in another terminal)
npm run dev
```

---

## 🌐 Access the Application

- **Laravel App**: [http://localhost:8000](http://localhost:8000)
- **Database**: SQLite file located at `database/database.sqlite`

---

## 🔧 Available Composer Scripts

The project includes several useful Composer scripts:

```bash
# Development (starts both Laravel and Vite servers)
composer run dev

# Run tests
composer run test

# SSR Development (if using Server-Side Rendering)
composer run dev:ssr
```

---

## 📋 What Changed from Docker Version

### Removed Files:

- `Dockerfile`
- `docker-compose.yml`
- `DOCKER-README.md`

### Configuration Changes:

- **Database**: Changed from MySQL to SQLite
- **Environment**: Removed Docker-specific variables
- **URL**: Updated to `http://localhost:8000`
- **Dependencies**: All managed through local PHP/Node installations
- **Foreign Keys**: Disabled SQLite foreign key constraints for development
- **Sessions**: Updated sessions table to handle UUID user references properly
- **SQL Compatibility**: Updated all MySQL-specific SQL syntax to SQLite-compatible syntax

### Benefits of Local Setup:

- ✅ Faster startup time
- ✅ No Docker overhead
- ✅ Direct file system access
- ✅ Easier debugging
- ✅ Simple one-command development

---

## 🛠 Development Workflow

1. **Start development**: `composer run dev`
2. **Make changes**: Edit your PHP/React files
3. **View changes**: Automatic reload thanks to Vite HMR
4. **Database changes**: Run `php artisan migrate` when needed
5. **Stop servers**: Press `Ctrl+C` in the terminal

---

## 📁 Project Structure

```
├── app/                    # Laravel application code
├── resources/js/          # React components and frontend code
├── resources/css/         # Stylesheets
├── database/              # Migrations, seeders, and SQLite database
├── public/                # Public assets
├── routes/                # Application routes
└── composer.json          # PHP dependencies and scripts
```

---

## 🔍 Troubleshooting

### If you encounter issues:

1. **Check PHP version**: `php --version` (should be 8.2+)
2. **Check Node version**: `node --version` (should be 18+)
3. **Clear Laravel cache**: `php artisan config:clear && php artisan cache:clear`
4. **Reinstall dependencies**: `composer install && npm install`
5. **Check database**: Ensure `database/database.sqlite` exists

### Database Issues:

If you encounter database constraint violations or foreign key errors:

```bash
# Reset the database completely
rm database/database.sqlite
touch database/database.sqlite
php artisan migrate
php artisan db:seed
```

### SQLite Specific Fixes:

The project has been optimized for SQLite with these changes:

- Foreign key constraints disabled during development (`DB_FOREIGN_KEYS=false`)
- Sessions table updated to properly handle UUID foreign keys
- Database migrations reordered to avoid constraint conflicts
- **SQL Syntax Updates**:
    - `DATE_FORMAT()` → `strftime()`
    - `CONCAT()` → `||` (concatenation operator)
    - `CURDATE() - INTERVAL 1 DAY` → `date('now', '-1 day')`
    - Removed MySQL-specific functions from all database queries

### View Laravel logs:

```bash
tail -f storage/logs/laravel.log
```

---

## ✅ You're All Set!

Your Attendance Management application is now running locally with:

- **Laravel 12** backend
- **React + Inertia.js** frontend
- **SQLite** database
- **Vite** for fast development and HMR

Happy coding! 🎉

---

## 📝 Additional Notes

- The SQLite database file is portable and perfect for development
- All data is stored locally in `database/database.sqlite`
- Vite provides instant hot reloading for React components
- Laravel serves both backend API and frontend through Inertia.js
