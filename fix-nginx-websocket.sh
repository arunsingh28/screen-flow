#!/bin/bash

# Script to fix Nginx WebSocket configuration for production
# Run with: sudo bash fix-nginx-websocket.sh

set -e

echo "========================================="
echo "Nginx WebSocket Configuration Fix"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: This script must be run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}Step 1: Backing up current Nginx configuration...${NC}"
BACKUP_DIR="/root/nginx-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /etc/nginx "$BACKUP_DIR/"
echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking for existing WebSocket mapping...${NC}"
if grep -q "map \$http_upgrade \$connection_upgrade" /etc/nginx/nginx.conf; then
    echo -e "${GREEN}✓ WebSocket mapping already exists${NC}"
else
    echo -e "${YELLOW}Adding WebSocket mapping to nginx.conf...${NC}"

    # Find the http { block and add the mapping
    sed -i '/^http {/a\    # WebSocket upgrade mapping\n    map $http_upgrade $connection_upgrade {\n        default upgrade;\n        '\'\'' close;\n    }' /etc/nginx/nginx.conf

    echo -e "${GREEN}✓ WebSocket mapping added${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors${NC}"
    echo -e "${YELLOW}Restoring from backup...${NC}"
    rm -rf /etc/nginx
    cp -r "$BACKUP_DIR/nginx" /etc/nginx/
    echo -e "${GREEN}✓ Configuration restored${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Reloading Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded successfully${NC}"
echo ""

echo -e "${GREEN}========================================="
echo "Configuration Update Complete!"
echo "=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify Cloudflare WebSocket is enabled (Dashboard > Network)"
echo "2. Update frontend to use reconnecting WebSocket (see frontend/utils/websocket.ts)"
echo "3. Test WebSocket connection from browser console"
echo ""
echo "To verify WebSocket is working:"
echo "  docker-compose logs -f api | grep WebSocket"
echo ""
echo -e "${YELLOW}Note: Your old configuration is backed up at:${NC}"
echo "  $BACKUP_DIR"
