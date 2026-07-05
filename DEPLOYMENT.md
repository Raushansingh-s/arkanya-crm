# Production Deployment Guide — Arkanya Edutech

This document outlines the step-by-step procedure to deploy the Arkanya Edutech full-stack SaaS platform to a production server (AWS EC2, DigitalOcean, VPS, or On-Premise server).

---

## 🏗️ Option A: Containerized Deployment (Recommended)
This option uses **Docker** and **Docker Compose** to run the backend API server, React frontend bundle, and PostgreSQL database inside isolated containers.

### Prerequisites
* Install **Docker** and **Docker Compose** on the server.

### Step 1: Create `Dockerfile` in the Backend (`/backend/Dockerfile`)
```dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Step 2: Create `Dockerfile` in the Frontend (`/frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
# Copy custom Nginx configuration to support client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 3: Create `nginx.conf` in the Frontend (`/frontend/nginx.conf`)
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend container
    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Step 4: Create `docker-compose.yml` in the project Root
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: arkanya_db
    restart: always
    environment:
      POSTGRES_DB: arkanya_erp
      POSTGRES_USER: arkanya_admin
      POSTGRES_PASSWORD: SecureDbPassword123
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: arkanya_backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: "postgresql://arkanya_admin:SecureDbPassword123@postgres:5432/arkanya_erp?schema=public"
      JWT_SECRET: "SuperSecureProductionJWTSecretKey998822!!"
      PORT: 5000
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    container_name: arkanya_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

### Step 5: Launch the stack
```bash
docker-compose up -d --build
```

---

## ⚙️ Option B: Manual Process-Based Deployment (PM2 + Nginx)
This option runs the applications directly on the host operating system using **PM2** for process management and **Nginx** as a reverse proxy.

### Step 1: Install Node.js, PM2, and Nginx
```bash
# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install pm2 -g

# Install Nginx
sudo apt-get update
sudo apt-get install nginx -y
```

### Step 2: Set Up Backend (API Server)
1. Navigate to `/backend`.
2. Configure `.env`:
   ```env
   DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
   JWT_SECRET="SuperSecureProductionJWTSecretKey998822!!"
   PORT=5000
   ```
3. Run migrations and compile:
   ```bash
   npm install
   npx prisma db push
   npm run build
   ```
4. Start the backend app via PM2:
   ```bash
   pm2 start dist/index.js --name "arkanya-backend"
   pm2 save
   pm2 startup
   ```

### Step 3: Build & Host Frontend (React Client)
1. Navigate to `/frontend`.
2. Install dependencies & build:
   ```bash
   npm install
   npm run build
   ```
3. Move the production bundle to Web hosting directory:
   ```bash
   sudo mkdir -p /var/web/arkanya
   sudo cp -r dist/* /var/web/arkanya/
   ```

### Step 4: Configure Nginx Reverse Proxy
1. Create a server block config:
   ```bash
   sudo nano /etc/nginx/sites-available/arkanya
   ```
2. Paste the following configuration:
   ```nginx
   server {
       listen 80;
       server_name erp.arkanya.in; # Change to your domain name

       location / {
           root /var/web/arkanya;
           index index.html index.htm;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://localhost:5000/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Enable configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/arkanya /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```
