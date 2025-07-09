# 🎓 Attendance Management System

Modern web application built with Laravel 12 and React for managing class attendance with QR code functionality. This system allows teachers to create and manage classes, generate QR codes for attendance tracking, and provides students with an easy way to mark their attendance using mobile devices.

## 🚀 Quick Start

**New to the project? Start here!**

See the [Docker Setup Guide](./DOCKER-README.md) for full instructions on running and developing this project with Docker.
---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
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

# Run a specific test file
php artisan test tests/Feature/ClassControllerTest.php

# Run with code coverage report
php artisan test --coverage
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Thank you for using the Attendance Management System! If you have any questions or suggestions, feel free to open an issue or contribute to the project.
