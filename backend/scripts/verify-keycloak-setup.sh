#!/bin/bash

# Keycloak Setup Verification Script
# This script checks if Keycloak is properly configured and running

echo "🔍 Keycloak Setup Verification"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "1. Checking Docker..."
if docker ps > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is running${NC}"
else
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "   Please start Docker Desktop or Docker daemon"
    exit 1
fi

# Check if Keycloak container is running
echo ""
echo "2. Checking Keycloak container..."
KEYCLOAK_RUNNING=$(docker ps --filter "name=keycloak" --format "{{.Names}}" 2>/dev/null)

if [ -z "$KEYCLOAK_RUNNING" ]; then
    echo -e "${YELLOW}⚠️  Keycloak container not found${NC}"
    echo "   Checking for Keycloak in docker-compose..."
    
    # Check if docker-compose file exists
    if [ -f "/Users/omar/keycloak-local/docker-compose.yml" ]; then
        echo "   Found docker-compose.yml at /Users/omar/keycloak-local"
        echo "   Run: cd /Users/omar/keycloak-local && docker-compose up -d"
    else
        echo -e "${RED}❌ Keycloak docker-compose.yml not found${NC}"
        echo "   Expected location: /Users/omar/keycloak-local/docker-compose.yml"
    fi
else
    echo -e "${GREEN}✅ Keycloak container is running: $KEYCLOAK_RUNNING${NC}"
fi

# Check if Keycloak is accessible
echo ""
echo "3. Checking Keycloak accessibility..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Keycloak is accessible at http://localhost:8080${NC}"
else
    echo -e "${RED}❌ Keycloak is not accessible at http://localhost:8080${NC}"
    echo "   Make sure Keycloak container is running"
fi

# Check backend .env configuration
echo ""
echo "4. Checking backend configuration..."
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ Backend .env file exists${NC}"
    
    # Check for Keycloak config
    if grep -q "KEYCLOAK_SERVER_URL" backend/.env; then
        KEYCLOAK_URL=$(grep "KEYCLOAK_SERVER_URL" backend/.env | cut -d '=' -f2)
        echo -e "${GREEN}✅ KEYCLOAK_SERVER_URL is set: $KEYCLOAK_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  KEYCLOAK_SERVER_URL not found in .env${NC}"
        echo "   Run: ./scripts/setup-keycloak-env.sh"
    fi
    
    if grep -q "KEYCLOAK_REALM" backend/.env; then
        KEYCLOAK_REALM=$(grep "KEYCLOAK_REALM" backend/.env | cut -d '=' -f2)
        echo -e "${GREEN}✅ KEYCLOAK_REALM is set: $KEYCLOAK_REALM${NC}"
    else
        echo -e "${YELLOW}⚠️  KEYCLOAK_REALM not found in .env${NC}"
    fi
else
    echo -e "${RED}❌ Backend .env file not found${NC}"
    echo "   Create backend/.env file or run setup script"
fi

# Check backend dependencies
echo ""
echo "5. Checking backend dependencies..."
cd backend 2>/dev/null || { echo -e "${RED}❌ Backend directory not found${NC}"; exit 1; }

if [ -f "package.json" ]; then
    if npm list keycloak-connect > /dev/null 2>&1; then
        echo -e "${GREEN}✅ keycloak-connect is installed${NC}"
    else
        echo -e "${YELLOW}⚠️  keycloak-connect is not installed${NC}"
        echo "   Run: npm install keycloak-connect express-session memorystore"
    fi
    
    if npm list express-session > /dev/null 2>&1; then
        echo -e "${GREEN}✅ express-session is installed${NC}"
    else
        echo -e "${YELLOW}⚠️  express-session is not installed${NC}"
    fi
    
    if npm list memorystore > /dev/null 2>&1; then
        echo -e "${GREEN}✅ memorystore is installed${NC}"
    else
        echo -e "${YELLOW}⚠️  memorystore is not installed${NC}"
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
fi

cd ..

# Test Keycloak admin console
echo ""
echo "6. Testing Keycloak Admin Console..."
if curl -s http://localhost:8080 | grep -q "Keycloak" 2>/dev/null; then
    echo -e "${GREEN}✅ Keycloak Admin Console is accessible${NC}"
    echo "   URL: http://localhost:8080"
    echo "   Login: admin / admin"
else
    echo -e "${YELLOW}⚠️  Could not verify Keycloak Admin Console${NC}"
    echo "   Try accessing: http://localhost:8080"
fi

# Summary
echo ""
echo "=============================="
echo "📋 Summary"
echo "=============================="
echo ""
echo "Next steps:"
echo "1. If Keycloak is not running:"
echo "   cd /Users/omar/keycloak-local && docker-compose up -d"
echo ""
echo "2. Access Keycloak Admin Console:"
echo "   http://localhost:8080 (admin/admin)"
echo ""
echo "3. Create Realm 'egseekers' in Keycloak"
echo ""
echo "4. Create Client 'egseekers-backend' in Keycloak"
echo ""
echo "5. Create Roles: ADMIN, CLIENT, FREELANCER"
echo ""
echo "6. Test backend connection:"
echo "   curl http://localhost:5001/api/keycloak/status"
echo ""
echo "For detailed guide, see: backend/docs/DOCKER_ESB_GUIDE.md"

