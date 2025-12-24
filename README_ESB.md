# ESB Setup Instructions (Redis)

## Quick Start

### Option 1: Using the Startup Script (Recommended)

```bash
cd /Users/omar/Library/CloudStorage/OneDrive-ArabAcademyforScienceandTechnology/Grad/mekky-s-app-main
./START_ESB.sh
```

### Option 2: Manual Start

```bash
# Navigate to project root directory
cd /Users/omar/Library/CloudStorage/OneDrive-ArabAcademyforScienceandTechnology/Grad/mekky-s-app-main

# Start Redis
docker-compose up -d redis

# Start backend (if using docker-compose)
docker-compose up -d backend

# Check status
docker-compose ps
```

### Option 3: From Any Directory

```bash
# Specify the file path explicitly
docker-compose -f /Users/omar/Library/CloudStorage/OneDrive-ArabAcademyforScienceandTechnology/Grad/mekky-s-app-main/docker-compose.yml up -d redis
```

## Verify Installation

```bash
# Check Redis status (with password)
docker exec -it egseekers-redis redis-cli -a redis123 PING

# Test Redis connection
docker exec -it egseekers-redis redis-cli -a redis123
# Type: PING (should return PONG)

# Check backend health
curl http://localhost:10000/api/health

# Check ESB status (admin only)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:10000/api/esb/status
```

## Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

## View Logs

```bash
# Redis logs
docker-compose logs -f redis

# Backend logs
docker-compose logs -f backend

# All services
docker-compose logs -f
```

## Redis Commands

```bash
# Connect to Redis CLI (with password)
docker exec -it egseekers-redis redis-cli -a redis123

# Or set password as environment variable
export REDIS_PASSWORD=redis123
docker exec -it egseekers-redis redis-cli -a $REDIS_PASSWORD

# Check connection
PING

# List all keys
KEYS *

# Get service registrations
KEYS service:*

# Get cache keys
KEYS jobs:*
KEYS user:*

# Get Redis info
INFO
```

## More Information

- Integration Guide: `backend/ESB_INTEGRATION.md`
