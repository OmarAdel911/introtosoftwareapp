# Redis Quick Start Guide

## Connecting to Redis

Redis is configured with password authentication. Use one of these methods:

### Method 1: Using Password Flag

```bash
# Test connection
docker exec egseekers-redis redis-cli -a redis123 PING

# Connect to Redis CLI
docker exec -it egseekers-redis redis-cli -a redis123
```

### Method 2: Using Environment Variable

```bash
# Set password
export REDIS_PASSWORD=redis123

# Test connection
docker exec egseekers-redis redis-cli -a $REDIS_PASSWORD PING

# Connect to Redis CLI
docker exec -it egseekers-redis redis-cli -a $REDIS_PASSWORD
```

### Method 3: Interactive Session

```bash
# Start interactive session
docker exec -it egseekers-redis redis-cli -a redis123

# Then run commands:
PING
KEYS *
INFO
```

## Common Commands

Once connected to Redis CLI:

```bash
# Check connection
PING

# List all keys
KEYS *

# Get specific keys
KEYS service:*
KEYS jobs:*
KEYS user:*
KEYS rate_limit:*

# Get value of a key
GET service:backend-api

# Get Redis server info
INFO

# Get memory usage
INFO memory

# Clear all keys (use with caution!)
FLUSHALL

# Clear specific pattern
KEYS pattern:* | xargs redis-cli -a redis123 DEL
```

## Troubleshooting

### Authentication Error

If you get `(error) NOAUTH Authentication required`:

1. Make sure you're using the `-a` flag with the password:
   ```bash
   docker exec egseekers-redis redis-cli -a redis123 PING
   ```

2. Check the password in docker-compose.yml or .env file

3. Restart Redis if password was changed:
   ```bash
   docker-compose restart redis
   ```

### Connection Refused

If Redis isn't responding:

1. Check if Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Check Redis logs:
   ```bash
   docker-compose logs redis
   ```

3. Restart Redis:
   ```bash
   docker-compose restart redis
   ```

## Default Password

The default Redis password is `redis123`. 

**⚠️ IMPORTANT**: Change this in production by setting `REDIS_PASSWORD` in your `.env` file.

