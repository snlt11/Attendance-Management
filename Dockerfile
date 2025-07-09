# Base image: PHP 8.2 + Apache
FROM php:8.2-apache

# Set working directory to app root
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      libzip-dev zip unzip git curl libonig-dev && \
    docker-php-ext-install pdo_mysql zip && \
    a2enmod rewrite headers && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js (Vite & React)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Copy composer files first for caching
COPY composer.json composer.lock ./

# Copy full application (including artisan, public folder)
COPY . ./

# Configure Apache to use Laravel's public directory
RUN sed -ri 's!DocumentRoot /var/www/html!DocumentRoot /var/www/html/public!g' /etc/apache2/sites-available/*.conf && \
    sed -ri 's!<Directory /var/www/html>!<Directory /var/www/html/public>!g' /etc/apache2/sites-available/*.conf

# Install Composer and PHP dependencies
RUN curl -sS https://getcomposer.org/installer | php -- \
        --install-dir=/usr/bin --filename=composer && \
    composer install --prefer-dist --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies & build assets
RUN npm ci && npm run build

# Fix permissions for storage/bootstrap
RUN chown -R www-data:www-data storage bootstrap/cache || true

# Expose Apache port
EXPOSE 80
CMD ["apache2-foreground"]
