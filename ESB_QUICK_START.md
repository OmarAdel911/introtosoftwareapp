# ESB Quick Start Guide

## What is ESB?

Enterprise Service Bus (ESB) is a middleware architecture pattern that provides a centralized communication layer between services. In this application, we use **Kong API Gateway** as the ESB.

## Benefits

✅ **Centralized Routing**: All API requests go through Kong  
✅ **Rate Limiting**: Protect services from abuse  
✅ **Security**: CORS, authentication, IP whitelisting  
✅ **Monitoring**: Prometheus metrics, logging  
✅ **Load Balancing**: Distribute traffic across instances  
✅ **Service Discovery**: Automatic service registration  

## Quick Start

### 1. Start the ESB

```bash
# Start all services (Kong + Backend)
docker-compose up -d

# Check Kong status
curl http://localhost:8001/

# Check backend health through Kong
curl http://localhost:8000/health
```

### 2. Access Points

- **Kong Proxy**: http://localhost:8000 (use this for API calls)
- **Kong Admin API**: http://localhost:8001 (management)
- **Kong Admin UI**: http://localhost:8002 (web interface)
- **Backend Direct**: http://localhost:10000 (bypass Kong)

### 3. Test the Integration

```bash
# Test health endpoint through Kong
curl http://localhost:8000/health

# Test jobs endpoint through Kong
curl http://localhost:8000/api/jobs

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/me
```

### 4. View Services

```bash
# List all services
curl http://localhost:8001/services

# List all routes
curl http://localhost:8001/routes

# View metrics
curl http://localhost:8001/metrics
```

## Architecture

```
┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌─────────────────┐
│  Kong Gateway   │  ← ESB Layer
│  (Port 8000)    │
└────┬────────────┘
     │
     ├─── Rate Limiting
     ├─── CORS
     ├─── Request Transformation
     └─── Monitoring
     │
     ▼
┌─────────────────┐
│  Backend API     │
│  (Port 10000)   │
└─────────────────┘
```

## Services Registered

All these services are automatically registered in Kong:

- ✅ Backend API (`/api/*`)
- ✅ Health Service (`/health`)
- ✅ Auth Service (`/api/auth`)
- ✅ Keycloak Service (`/api/keycloak`)
- ✅ Jobs Service (`/api/jobs`)
- ✅ Payments Service (`/api/payments`)
- ✅ Contracts Service (`/api/contracts`)
- ✅ Credits Service (`/api/credits`)
- ✅ Users Service (`/api/users`)
- ✅ Dashboard Service (`/api/dashboard`)
- ✅ Admin Service (`/api/admin`)

## Rate Limits

Each service has configured rate limits:

| Service | Per Minute | Per Hour |
|---------|-----------|----------|
| Auth | 20 | 200 |
| Payments | 30 | 200 |
| Jobs | 60 | 500 |
| Credits | 50 | 400 |
| Admin | 30 | 200 |

## Using ESB Service Layer

The backend includes an ESB service layer for inter-service communication:

```javascript
const esbService = require('./services/esbService');

// Get jobs through ESB
const result = await esbService.getJobs({ category: 'web-development' });

// Get user through ESB
const user = await esbService.getUser(userId, token);

// Purchase credits through ESB
const checkout = await esbService.purchaseCredits(packageId, token);
```

## Monitoring

### Prometheus Metrics

Access metrics at: `http://localhost:8001/metrics`

### Health Checks

- Kong: `http://localhost:8001/`
- Backend through Kong: `http://localhost:8000/health`
- ESB Status: `GET /api/esb/status` (admin only)

## Troubleshooting

### Kong not starting?

```bash
# Check logs
docker logs kong-gateway
docker logs kong-database
docker logs kong-migration

# Restart services
docker-compose restart kong
```

### Services not accessible?

```bash
# Verify services are registered
curl http://localhost:8001/services

# Check routes
curl http://localhost:8001/routes

# Test direct backend access
curl http://localhost:10000/api/health
```

### Rate limit errors?

Check rate limit configuration in `kong/kong.yml` and adjust as needed.

## Next Steps

1. **Configure Authentication**: Add JWT/OAuth plugins at Kong level
2. **Set up Monitoring**: Integrate Prometheus + Grafana
3. **Add Caching**: Configure Redis for caching
4. **Production Setup**: Enable HTTPS, IP whitelisting, etc.

## Documentation

- Full Guide: `backend/ESB_INTEGRATION.md`
- Kong Docs: https://docs.konghq.com/

## Support

For issues or questions:
1. Check logs: `docker logs kong-gateway`
2. Review configuration: `kong/kong.yml`
3. Check ESB status: `GET /api/esb/status`

