# ESB Integration Guide (Redis-based)

## Overview

This application uses **Redis** as an Enterprise Service Bus (ESB) component for caching, pub/sub messaging, rate limiting, and service coordination.

## Architecture

```
Client → Backend API → Redis (ESB Layer)
         ↓
    - Caching
    - Pub/Sub Messaging
    - Rate Limiting
    - Service Discovery
    - Session Storage
```

## Components

### 1. Redis Server
- **Port**: 6379
- **Password**: Configurable via `REDIS_PASSWORD` env variable
- **Persistence**: AOF (Append Only File) enabled
- **Use Cases**:
  - API response caching
  - Rate limiting
  - Pub/Sub messaging
  - Service discovery
  - Session storage

### 2. ESB Service Layer

The backend includes an ESB service layer (`backend/services/esbService.js`) that provides:
- **Caching**: Cache API responses to reduce database load
- **Rate Limiting**: Redis-based rate limiting
- **Pub/Sub**: Publish/subscribe messaging for inter-service communication
- **Service Discovery**: Register and discover services
- **Health Checks**: Monitor Redis connection status

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Environment variables configured in `.env` file

### Starting Redis

1. **Start Redis**:
   ```bash
   docker-compose up -d redis
   ```

2. **Check Redis status**:
   ```bash
   docker-compose ps redis
   ```

3. **Test Redis connection**:
   ```bash
   docker exec -it egseekers-redis redis-cli
   # Then type: PING (should return PONG)
   ```

### Configuration

#### Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis123  # Change in production
```

#### Backend Configuration

The backend automatically connects to Redis on startup. The ESB service layer handles:
- Connection management
- Error handling
- Automatic reconnection

## Usage

### Caching

```javascript
const esbService = require('./services/esbService');

// Get cached data
const cached = await esbService.getCache('jobs:all');

// Set cache with TTL (default 1 hour)
await esbService.setCache('jobs:all', jobsData, 3600);

// Delete cache
await esbService.deleteCache('jobs:all');
```

### Rate Limiting

```javascript
// Check rate limit
const limit = await esbService.checkRateLimit(
  'user:123',  // identifier
  100,         // limit
  3600         // window in seconds
);

if (!limit.allowed) {
  // Rate limit exceeded
}
```

### Pub/Sub Messaging

```javascript
// Publish message
await esbService.publish('notifications', {
  userId: '123',
  message: 'New job posted'
});

// Subscribe to channel
await esbService.subscribe('notifications', (message) => {
  console.log('Received:', message);
});
```

### Service Discovery

```javascript
// Register service
await esbService.registerService('jobs-service', {
  url: 'http://localhost:5001/api/jobs',
  status: 'active'
});

// Get service
const service = await esbService.getService('jobs-service');

// Get all services
const services = await esbService.getAllServices();
```

## API Endpoints

### ESB Management (Admin Only)

- `GET /api/esb/status` - Get ESB status and services
- `GET /api/esb/services` - List all registered services
- `POST /api/esb/services` - Register a new service
- `GET /api/esb/redis/info` - Get Redis server information
- `GET /api/esb/health` - Health check through ESB

## Features

### 1. Caching

- **Automatic caching** for frequently accessed data
- **TTL support** for cache expiration
- **Cache invalidation** on data updates
- **Cache keys** follow pattern: `{type}:{identifier}`

### 2. Rate Limiting

- **Redis-based** rate limiting
- **Per-user/IP** rate limits
- **Configurable** limits and windows
- **Automatic expiration** of rate limit counters

### 3. Pub/Sub Messaging

- **Real-time** messaging between services
- **Channel-based** subscriptions
- **JSON message** support
- **Automatic reconnection** on failures

### 4. Service Discovery

- **Dynamic service registration**
- **Service health tracking**
- **Automatic expiration** (60 seconds TTL)
- **Service lookup** by name

## Monitoring

### Redis Commands

```bash
# Connect to Redis CLI (with password)
docker exec -it egseekers-redis redis-cli -a redis123

# Or use environment variable
export REDIS_PASSWORD=redis123
docker exec -it egseekers-redis redis-cli -a $REDIS_PASSWORD

# Check connection
PING

# Get all keys
KEYS *

# Get service registrations
KEYS service:*

# Get rate limit keys
KEYS rate_limit:*

# Get cache keys
KEYS jobs:*
KEYS user:*

# Get Redis info
INFO
```

### Health Checks

- ESB health: `GET /api/esb/health`
- Redis connection: Automatically checked on each operation
- Service status: `GET /api/esb/services`

## Troubleshooting

### Redis not connecting

1. Check Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Check Redis logs:
   ```bash
   docker-compose logs redis
   ```

3. Test connection (with password):
   ```bash
   docker exec -it egseekers-redis redis-cli -a redis123 PING
   ```

4. If authentication fails, check password:
   ```bash
   # Check environment variable
   echo $REDIS_PASSWORD
   
   # Or check docker-compose config
   docker-compose config | grep REDIS_PASSWORD
   ```

### Cache not working

1. Verify Redis connection in backend logs
2. Check cache keys: `docker exec -it egseekers-redis redis-cli KEYS *`
3. Verify TTL: `docker exec -it egseekers-redis redis-cli TTL {key}`

### Rate limiting issues

1. Check rate limit keys: `KEYS rate_limit:*`
2. Verify limit configuration in code
3. Clear rate limits if needed: `DEL rate_limit:{identifier}`

## Production Considerations

1. **Security**:
   - Use strong Redis password
   - Enable Redis AUTH
   - Restrict Redis port access
   - Use SSL/TLS for Redis connections

2. **Performance**:
   - Configure Redis memory limits
   - Use Redis persistence (RDB + AOF)
   - Set up Redis replication
   - Monitor Redis memory usage

3. **High Availability**:
   - Set up Redis Sentinel
   - Use Redis Cluster for scaling
   - Implement failover mechanisms
   - Monitor Redis health

4. **Monitoring**:
   - Set up Redis monitoring (Prometheus + Grafana)
   - Monitor cache hit rates
   - Track rate limit violations
   - Monitor pub/sub message throughput

## Next Steps

1. **Add Caching Middleware**: Create Express middleware for automatic caching
2. **Set up Rate Limiting Middleware**: Integrate rate limiting into routes
3. **Implement Pub/Sub Handlers**: Create message handlers for different channels
4. **Add Monitoring**: Set up Redis monitoring and alerting
5. **Optimize Cache Strategy**: Fine-tune cache TTLs and invalidation

## Resources

- [Redis Documentation](https://redis.io/docs/)
- [Redis Node.js Client](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
