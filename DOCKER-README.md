# Attendance Management - Docker Setup Guide

This guide explains how to run the [Attendance Management](https://github.com/snlt11/Attendance-Management.git) project with **Laravel 12 + Inertia + React** using **Docker**.

## 🚀 Requirements

* Docker & Docker Compose installed
* Ports `7001`, `7002`, and `7003` should be free

---

## 📦 Project Setup

### 1. Clone the repository

```bash
git clone https://github.com/snlt11/Attendance-Management.git
cd Attendance-Management
```

### 2. Create `.env` file

```bash
cp .env.example .env
```

### 3. Update `.env` database section:

```env
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=attendance_management
DB_USERNAME=admin
DB_PASSWORD=secret
```

### 4. Build and start containers

```bash
docker-compose up --build -d
```

---

## 🔧 Initial Laravel setup inside container

### 5. Generate application key

```bash
docker-compose exec backend php artisan key:generate
```

### 6. Run database migrations

```bash
docker-compose exec backend php artisan migrate
```

> You can also seed data with:
>
> ```bash
> docker-compose exec backend php artisan db:seed
> ```

### 7. Start Vite dev server with HMR

```bash
docker-compose exec backend npm install

docker-compose exec backend npm run build
```
(optional, for production build)
```
docker-compose exec backend npm run dev -- --host
```

---

## 🌐 Access the app

* Laravel App: [http://localhost:7001](http://localhost:7001)
* phpMyAdmin: [http://localhost:7002](http://localhost:7002)

  * Server: `db`
  * Username: `root`
  * Password: `root`

---

## 📌 Notes

* You don’t need to visit port 7004 (Vite); all frontend is served through Laravel.
* Laravel uses Inertia to render React components.
* Vite handles HMR and asset bundling inside the same container.

---

## 🛑 Stop containers

```bash
docker-compose down
```

---

## ✅ You're all set!

You're now running a full Laravel 12 + React + MySQL stack inside Docker with phpMyAdmin access.

---

For any issues, please check the Laravel logs:

```bash
docker-compose exec backend tail -f storage/logs/laravel.log
```

Enjoy building your app! 🎉
