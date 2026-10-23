#!/usr/bin/env bash

# ==============================================================================
# Sastika Mobiles Billing - VPS Redeploy Automation Script
# Usage: ./deploy.sh  or  bash deploy.sh
# ==============================================================================

set -e

# Terminal Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/var/www/sastika-mobiles-billing"
BRANCH="main"
PM2_APP_NAME="sastika-server"

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}🚀 Starting Sastika Mobiles Billing Redeployment...${NC}"
echo -e "${BLUE}📅 Date: $(date)${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Navigate to Project Directory
if [ -d "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
else
  # If executed from inside project directory
  PROJECT_DIR="$(pwd)"
fi
echo -e "${GREEN}📁 Working Directory: ${PROJECT_DIR}${NC}"

# 2. Pull Latest Changes from Git
echo -e "${YELLOW}⬇️  Pulling latest code from origin/${BRANCH}...${NC}"
git fetch origin ${BRANCH}
git reset --hard origin/${BRANCH}

# 3. Install Root (Frontend) Dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install --legacy-peer-deps

# 4. Build React / Vite Frontend
echo -e "${YELLOW}🔨 Building frontend for production (Vite)...${NC}"
npm run build

# 5. Install Backend Dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd "${PROJECT_DIR}/server"
npm install --production

# 6. Restart / Reload Backend Process via PM2
echo -e "${YELLOW}🔄 Managing PM2 backend process (${PM2_APP_NAME})...${NC}"
if command -v pm2 &> /dev/null; then
  if pm2 list | grep -q "${PM2_APP_NAME}"; then
    echo -e "${GREEN}♻️  Restarting existing PM2 process: ${PM2_APP_NAME}${NC}"
    pm2 restart "${PM2_APP_NAME}" --update-env
  else
    echo -e "${GREEN}▶️  Starting new PM2 process: ${PM2_APP_NAME}${NC}"
    pm2 start index.js --name "${PM2_APP_NAME}"
  fi
  pm2 save
else
  echo -e "${RED}⚠️  PM2 is not installed globally. Install it with: npm install -g pm2${NC}"
fi

# 7. Reload Nginx (if installed and configured)
cd "${PROJECT_DIR}"
if command -v nginx &> /dev/null; then
  echo -e "${YELLOW}🌐 Testing and reloading Nginx web server...${NC}"
  if nginx -t 2>/dev/null; then
    systemctl reload nginx || service nginx reload || true
    echo -e "${GREEN}✅ Nginx reloaded successfully!${NC}"
  else
    echo -e "${YELLOW}⚠️  Nginx config test failed or sudo needed, please check nginx config.${NC}"
  fi
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your updated application is now live.${NC}"
echo -e "${GREEN}====================================================${NC}"
