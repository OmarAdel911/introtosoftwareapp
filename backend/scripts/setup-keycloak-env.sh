#!/bin/bash

# Script to add Keycloak configuration to backend .env file
# Usage: ./scripts/setup-keycloak-env.sh

ENV_FILE=".env"
KEYCLOAK_CONFIG="# Keycloak Configuration (Docker Local)
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=egseekers
KEYCLOAK_CLIENT_ID=egseekers-backend
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_PUBLIC_CLIENT=true
KEYCLOAK_BEARER_ONLY=false

# Session Secret (change in production!)
SESSION_SECRET=egseekers-session-secret-$(openssl rand -hex 16)"

echo "Setting up Keycloak configuration for Docker instance..."

if [ -f "$ENV_FILE" ]; then
    # Check if Keycloak config already exists
    if grep -q "KEYCLOAK_SERVER_URL" "$ENV_FILE"; then
        echo "⚠️  Keycloak configuration already exists in .env"
        echo "Updating existing configuration..."
        # Remove old Keycloak config
        sed -i.bak '/^# Keycloak Configuration/,/^SESSION_SECRET=/d' "$ENV_FILE"
    fi
    # Append new config
    echo "" >> "$ENV_FILE"
    echo "$KEYCLOAK_CONFIG" >> "$ENV_FILE"
    echo "✅ Keycloak configuration added to existing .env file"
else
    # Create new .env file
    echo "$KEYCLOAK_CONFIG" > "$ENV_FILE"
    echo "✅ Created new .env file with Keycloak configuration"
fi

echo ""
echo "Configuration added:"
echo "  KEYCLOAK_SERVER_URL=http://localhost:8080"
echo "  KEYCLOAK_REALM=egseekers"
echo "  KEYCLOAK_CLIENT_ID=egseekers-backend"
echo ""
echo "Next steps:"
echo "1. Make sure Keycloak Docker is running: cd /Users/omar/keycloak-local && docker-compose up -d"
echo "2. Access Keycloak admin: http://localhost:8080 (admin/admin)"
echo "3. Create realm 'egseekers' and client 'egseekers-backend'"
echo "4. Restart backend: npm run dev"

