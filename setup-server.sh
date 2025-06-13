#!/bin/bash

# Setup script untuk deploy TiketBusAlmira dengan nginx
# Jalankan sebagai root atau dengan sudo

echo "=== Setup TiketBusAlmira Server ==="

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing required packages..."
apt install -y nginx nodejs npm postgresql postgresql-contrib curl git

# Install PM2 for process management
echo "Installing PM2..."
npm install -g pm2

# Create project directory
PROJECT_DIR="/var/www/tiket-bus"
echo "Creating project directory at $PROJECT_DIR..."
mkdir -p $PROJECT_DIR

# Clone or copy project (jika belum ada)
if [ ! -d "$PROJECT_DIR/.git" ]; then
    echo "Project directory is empty. Please git clone your project to $PROJECT_DIR"
    echo "Example: git clone https://github.com/your-repo/TiketBusAlmira.git $PROJECT_DIR"
fi

# Setup backend
echo "Setting up backend..."
cd $PROJECT_DIR/backend
npm install

# Setup frontend
echo "Setting up frontend..."
cd $PROJECT_DIR/frontend
npm install
npm run build

# Setup nginx
echo "Setting up nginx configuration..."
cp $PROJECT_DIR/nginx.conf /etc/nginx/sites-available/tiket-bus-frontend
cp $PROJECT_DIR/nginx-api.conf /etc/nginx/sites-available/tiket-bus-api
ln -sf /etc/nginx/sites-available/tiket-bus-frontend /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/tiket-bus-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
echo "Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    systemctl restart nginx
    systemctl enable nginx
else
    echo "Nginx configuration has errors. Please check the configuration."
    exit 1
fi

# Setup PostgreSQL (basic setup)
echo "Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

echo "=== Manual Steps Required ==="
echo "1. Setup PostgreSQL database:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE tiket_bus_almira;"
echo "   CREATE USER your_user WITH PASSWORD 'your_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE tiket_bus_almira TO your_user;"
echo ""
echo "2. Create .env file in backend directory with:"
echo "   DB_HOST=localhost"
echo "   DB_PORT=5432"
echo "   DB_NAME=tiket_bus_almira"
echo "   DB_USER=your_user"
echo "   DB_PASSWORD=your_password"
echo "   JWT_SECRET=your_jwt_secret"
echo "   PORT=5000"
echo "   # Add other environment variables as needed"
echo ""
echo "3. Start backend with PM2:"
echo "   cd $PROJECT_DIR/backend"
echo "   pm2 start server.js --name tiket-bus-backend"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "4. Update nginx.conf with your actual domain name"
echo ""
echo "5. For SSL (recommended):"
echo "   Install certbot: apt install certbot python3-certbot-nginx"
echo "   Get certificate: certbot --nginx -d your-domain.com"
echo ""
echo "Setup completed! Check nginx status: systemctl status nginx"