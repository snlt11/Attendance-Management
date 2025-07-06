# Base PHP Image
FROM php:8.2-fpm-alpine as base

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    bash \
    curl \
    freetype-dev \
    g++ \
    gcc \
    git \
    icu-dev \
    jpeg-dev \
    libc-dev \
    libpng-dev \
    libzip-dev \
    make \
    mysql-client \
    nodejs \
    npm \
    oniguruma-dev \
    openssh-client \
    rsync \
    sqlite \
    sqlite-dev \
    zip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        mbstring \
        pdo \
        pdo_mysql \
        pdo_sqlite \
        zip \
    && rm -rf /var/cache/apk/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader

# Copy application files
COPY . .

# Generate autoload files
RUN composer dump-autoload --optimize

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Backend target (PHP-FPM)
FROM base as backend

# Expose PHP-FPM port
EXPOSE 9000

# Start PHP-FPM
CMD ["php-fpm"]

# Frontend target (Node.js for Vite)
FROM node:18-alpine as frontend

# Set working directory
WORKDIR /var/www/html

# Copy package files
COPY package.json package-lock.json* ./

# Install Node.js dependencies
RUN npm ci

# Copy application files
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]