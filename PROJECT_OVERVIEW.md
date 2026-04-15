# RADANARAS SYSTEM - PROJECT OVERVIEW

## 🎯 PROJECT SUMMARY
**RadanarasSystem** is a full-stack logistics management web application for freight forwarding company "Radanaras MB". Built with React (frontend) + Node.js (backend) using JSON file-based data storage.

## 👤 USER INFORMATION
- **Name:** Saimondas Lukosius
- **Role:** Head of International Freight / Logistics Manager (Ekspeditorius / Logistikos vadybininkas)
- **Company:** Radanaras MB
- **Language:** Lithuanian (primary), English (technical)
- **Location:** Kaunas, Lithuania

## 💻 TECH STACK

### Frontend
- **Framework:** React + Vite
- **Port:** 5173 (development)
- **Build:** Production dist served by Nginx
- **Path:** `C:\Users\saimo\RadanarasSystem\frontend`

### Backend
- **Runtime:** Node.js 20.19.4
- **Port:** 3001
- **Database:** JSON files in `/backend/data/`
- **Path:** `C:\Users\saimo\RadanarasSystem\backend`
- **Key Dependencies:**
  - Express.js (API server)
  - Multer (file uploads)
  - pdf-lib (PDF manipulation)
  - tesseract.ocr (OCR for CMR documents)
  - **REMOVED:** pdf-poppler (Linux incompatible) → using `pdftoppm` CLI instead

### Data Storage
- **Type:** JSON files (NOT database yet)
- **Location:** `/backend/data/`
- **Files:**
  - `clients.json` - 56 freight clients
  - `carriers.json` - 50 transport carriers
  - `orders.json` - 2 freight orders (užsakymai)
  - `settings.json` - App settings

## 🌍 DEPLOYMENT

### Production Server (Hostinger VPS)
- **URL:** http://76.13.76.9
- **Provider:** Hostinger KVM 2 (Lithuania, 23ms latency)
- **Specs:** 8GB RAM, 2 vCPU, 100GB NVMe SSD
- **OS:** Ubuntu 25.10
- **SSH:** `root@76.13.76.9` (password: Radanaras2026)
- **Path:** `/var/www/RadanarasSystem`

### Server Stack
- **Backend:** PM2 (process manager) on port 3001
- **Frontend:** Nginx serving `/frontend/dist/`
- **Proxy:** Nginx → `http://localhost:3001`
- **Backups:** Daily automatic (Hostinger)

### GitHub Repository
- **URL:** https://github.com/saimondaslukosius/RadanarasSystem.git
- **Visibility:** Public (should be private in production)
- **Branch:** main

## 🔧 KEY FIXES IMPLEMENTED

### 1. Linux Compatibility (Backend)
**Problem:** `pdf-poppler` package crashed with "linux is NOT supported"
**Solution:**
- Removed `pdf-poppler` from dependencies
- Using native `pdftoppm` CLI (installed via `apt-get install poppler-utils`)
- Platform detection in `backend/index.js`:
  - Windows: Uses `C:\poppler\Library\bin\pdftoppm.exe`
  - Linux: Uses `pdftoppm` from PATH
- Same fix for Tesseract OCR paths

### 2. Production Frontend URLs
**Problem:** Frontend hardcoded `localhost:3001` URLs
**Solution:**
- Created `.env.production` with `VITE_API_BASE_URL=` (empty = relative URLs)
- Frontend uses `import.meta.env.VITE_API_BASE_URL ?? ""`
- Production build uses `/api/` relative URLs → Nginx proxy

### 3. Nginx Proxy Configuration
**Problem:** `proxy_pass http://localhost:3001/;` (with trailing `/`) was stripping path
**Solution:** Changed to `proxy_pass http://localhost:3001;` (no trailing `/`)
**Config:** `/etc/nginx/sites-available/radanaras`

### 4. Data Persistence
**Status:** ✅ WORKING
- Backend writes to JSON files in `/var/www/RadanarasSystem/backend/data/`
- File permissions: `chmod -R 777` on data folder
- PM2 working directory: `/var/www/RadanarasSystem/backend`

### 5. Dashboard API Hardcoded URL Fix (2026-04-15)
**Problem:** Frontend had hardcoded `http://localhost:3001/api/dashboard/stats`
**Solution:** 
- Changed to use environment variable: `fetch(\\/api/dashboard/stats\)`
- Now works correctly in both development and production environments

## 📋 DEVELOPMENT WORKFLOW

### Local Development (Windows PC)
```bash
# Backend
cd C:\Users\saimo\RadanarasSystem\backend
node index.js  # or npm start

# Frontend
cd C:\Users\saimo\RadanarasSystem\frontend
npm run dev

# Access
Frontend: http://localhost:5173
Backend API: http://localhost:3001/api/data
Dashboard API: http://localhost:3001/api/dashboard/stats
```

### Deployment to Production
```bash
# 1. Local PC - Make changes & commit
git add .
git commit -m "Description"
git push

# 2. Server - Pull & restart
ssh root@76.13.76.9
cd /var/www/RadanarasSystem
git pull
cd frontend && npm run build  # if frontend changed
pm2 restart radanaras-backend
```

### Quick Start Script
**File:** `C:\Users\saimo\RadanarasSystem\start-radanaras.bat`
**One-click starts:**
1. Backend server (localhost:3001)
2. Frontend dev server (localhost:5173)
3. SSH to production server
4. Opens local browser (localhost:5173)
5. Opens production browser (76.13.76.9)
6. Opens Claude Code in project folder
7. Opens OpenAI Codex CLI

## 🔑 IMPORTANT PATHS

### Windows (Local Development)
- **Project Root:** `C:\Users\saimo\RadanarasSystem`
- **Backend:** `C:\Users\saimo\RadanarasSystem\backend`
- **Frontend:** `C:\Users\saimo\RadanarasSystem\frontend`
- **Claude Code:** `C:\Users\saimo\AppData\Roaming\npm\claude.cmd`
- **Startup Script:** `C:\Users\saimo\RadanarasSystem\start-radanaras.bat`

### Linux (Production Server)
- **Project Root:** `/var/www/RadanarasSystem`
- **Backend:** `/var/www/RadanarasSystem/backend`
- **Frontend Build:** `/var/www/RadanarasSystem/frontend/dist`
- **Data Files:** `/var/www/RadanarasSystem/backend/data/`
- **Nginx Config:** `/etc/nginx/sites-available/radanaras`
- **PM2 Logs:** `/root/.pm2/logs/radanaras-backend-*.log`
- **Dashboard Route:** `/var/www/RadanarasSystem/backend/routes/dashboard.js`

## 📊 CURRENT STATUS (as of 2026-04-15)

### ✅ WORKING
- **Backend** running on production (port 3001, PM2 managed)
- **Frontend** serving on production (Nginx)
- **Data persistence** (JSON files saving correctly)
- **CRUD operations** (Create, Read, Update, Delete)
- **Dashboard Phase 1** - Financial statistics:
  - Revenue (Pajamos): €2,400.00
  - Expenses (Išlaidos): €2,100.00  
  - Profit (Pelnas): €300.00
  - Profit margin: 12.5%
  - Active orders: 2
  - Total clients: 56
  - Total carriers: 50
  - Drafts: 0
- **Dashboard API endpoint:** `/api/dashboard/stats`
- Production accessible 24/7 at http://76.13.76.9

### ⏭️ PENDING (Future Tasks)
1. **Dashboard Phase 2:**
   - Revenue trend chart (last 6 months)
   - TOP 5 clients by revenue pie chart
   - Order status distribution chart

2. **Domain & SSL:**
   - Purchase domain (.lt or .com)
   - Configure DNS → 76.13.76.9
   - Setup Let's Encrypt SSL
   - Update Nginx for HTTPS

3. **Security:**
   - Make GitHub repo private
   - Add collaborator access
   - Implement user authentication

4. **Data Migration:**
   - Consider moving from JSON to MySQL
   - Implement proper backup system
   - Data validation & error handling

5. **Testing:**
   - Full CRUD testing (all entities)
   - File upload testing (CMR, logos, stamps)
   - Report generation testing
   - Cross-browser testing

## 🐛 KNOWN ISSUES
None currently! System is fully functional.

## 📝 COMMON COMMANDS

### Server Management
```bash
# SSH to server
ssh root@76.13.76.9

# Check PM2 status
pm2 status
pm2 logs radanaras-backend --lines 50

# Restart backend
pm2 restart radanaras-backend

# Restart Nginx
systemctl restart nginx
nginx -t  # test config first

# Check port
netstat -tlnp | grep 3001
```

### Git Operations
```bash
# Check status
git status

# Commit & push
git add .
git commit -m "Description"
git push

# Pull latest
git pull

# Restore file
git checkout HEAD -- backend/data/clients.json
```

### NPM Operations
```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Update package
npm install package-name@latest
```

## 🎓 LESSONS LEARNED

1. **Always test backend on Linux before deployment** - Windows-specific packages (pdf-poppler) fail on Linux
2. **Environment-based configs are essential** - Don't hardcode localhost URLs
3. **Nginx trailing slash matters** - `proxy_pass` with `/` strips path
4. **PM2 is reliable** - Perfect for Node.js process management
5. **JSON file storage works** - Sufficient for current scale (56 clients, 2 orders)
6. **Git is deployment tool** - Push/pull workflow is simple and effective
7. **Always use environment variables for API URLs** - Hardcoded URLs break in production

## 📈 DEPLOYMENT HISTORY

### 2026-04-14
- Initial production deployment
- Backend and frontend successfully deployed
- Data persistence working
- 56 clients, 2 orders in database

### 2026-04-15
- **Dashboard Phase 1 deployed:**
  - Created backend endpoint `/api/dashboard/stats`
  - Added financial statistics cards to frontend
  - Fixed hardcoded localhost URL issue
  - Deployed to production successfully

## 🔗 USEFUL LINKS
- Production: http://76.13.76.9
- GitHub: https://github.com/saimondaslukosius/RadanarasSystem.git
- Hostinger Panel: https://hpanel.hostinger.com
- Claude AI: https://claude.ai
