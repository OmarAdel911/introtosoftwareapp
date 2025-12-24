/**
 * ESB (Enterprise Service Bus) Service Layer
 * 
 * This service provides an abstraction layer for inter-service communication
 * using Redis for caching, pub/sub, rate limiting, and service coordination
 */

const redis = require('redis');
const axios = require('axios');

class ESBService {
  constructor() {
    // Redis configuration
    this.redisHost = process.env.REDIS_HOST || 'localhost';
    this.redisPort = process.env.REDIS_PORT || 6379;
    this.redisPassword = process.env.REDIS_PASSWORD || null;
    
    // Service registry
    this.services = {
      backend: process.env.BACKEND_URL || 'http://localhost:5001',
      keycloak: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
      stripe: 'https://api.stripe.com/v1'
    };

    // Redis client (lazy initialization)
    this.redisClient = null;
    this.redisSubscriber = null;
  }

  /**
   * Initialize Redis connection
   */
  async initRedis() {
    if (this.redisClient) {
      return this.redisClient;
    }

    try {
      const config = {
        socket: {
          host: this.redisHost,
          port: this.redisPort,
        }
      };

      if (this.redisPassword) {
        config.password = this.redisPassword;
      }

      this.redisClient = redis.createClient(config);
      this.redisClient.on('error', (err) => console.error('Redis Client Error:', err));
      this.redisClient.on('connect', () => console.log('✅ Redis connected'));
      
      await this.redisClient.connect();
      return this.redisClient;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      return null;
    }
  }

  /**
   * Get Redis client (with lazy initialization)
   */
  async getRedis() {
    if (!this.redisClient) {
      await this.initRedis();
    }
    return this.redisClient;
  }

  /**
   * Cache operations
   */
  async getCache(key) {
    try {
      const client = await this.getRedis();
      if (!client) return null;
      
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async setCache(key, value, ttl = 3600) {
    try {
      const client = await this.getRedis();
      if (!client) return false;
      
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async deleteCache(key) {
    try {
      const client = await this.getRedis();
      if (!client) return false;
      
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error:', error);
      return false;
    }
  }

  /**
   * Rate limiting using Redis
   */
  async checkRateLimit(identifier, limit, window) {
    try {
      const client = await this.getRedis();
      if (!client) return { allowed: true, remaining: limit };

      const key = `rate_limit:${identifier}`;
      const current = await client.incr(key);
      
      if (current === 1) {
        await client.expire(key, window);
      }

      const remaining = Math.max(0, limit - current);
      return {
        allowed: current <= limit,
        remaining,
        reset: await client.ttl(key)
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, remaining: limit };
    }
  }

  /**
   * Pub/Sub operations
   */
  async publish(channel, message) {
    try {
      const client = await this.getRedis();
      if (!client) return false;
      
      await client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }

  async subscribe(channel, callback) {
    try {
      if (!this.redisSubscriber) {
        const config = {
          socket: {
            host: this.redisHost,
            port: parseInt(this.redisPort),
          }
        };
        if (this.redisPassword) {
          config.password = this.redisPassword;
        }
        this.redisSubscriber = redis.createClient(config);
        this.redisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));
        await this.redisSubscriber.connect();
      }

      await this.redisSubscriber.subscribe(channel, (message, channelName) => {
        try {
          const parsed = JSON.parse(message);
          callback(parsed, channelName);
        } catch (e) {
          callback(message, channelName);
        }
      });
      return true;
    } catch (error) {
      console.error('Redis subscribe error:', error);
      return false;
    }
  }

  /**
   * Service discovery - register service in Redis
   */
  async registerService(serviceName, serviceData) {
    try {
      const client = await this.getRedis();
      if (!client) return false;
      
      const key = `service:${serviceName}`;
      await client.setEx(key, 60, JSON.stringify({
        ...serviceData,
        registeredAt: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Service registration error:', error);
      return false;
    }
  }

  async getService(serviceName) {
    return this.getCache(`service:${serviceName}`);
  }

  async getAllServices() {
    try {
      const client = await this.getRedis();
      if (!client) return [];
      
      const keys = await client.keys('service:*');
      const services = [];
      
      for (const key of keys) {
        const service = await this.getCache(key);
        if (service) {
          services.push({
            name: key.replace('service:', ''),
            ...service
          });
        }
      }
      
      return services;
    } catch (error) {
      console.error('Get services error:', error);
      return [];
    }
  }

  /**
   * Health check
   */
  async getHealth() {
    try {
      const client = await this.getRedis();
      if (!client) {
        return {
          success: false,
          status: 'unhealthy',
          error: 'Redis not connected'
        };
      }

      await client.ping();
      return {
        success: true,
        status: 'healthy',
        redis: 'connected'
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Direct API request (bypassing gateway, using direct backend)
   */
  async request(path, options = {}) {
    const {
      method = 'GET',
      data = null,
      headers = {},
      params = null,
      timeout = 30000
    } = options;

    const url = `${this.services.backend}${path}`;
    
    const config = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout,
      validateStatus: (status) => status < 500
    };

    if (data) {
      config.data = data;
    }

    if (params) {
      config.params = params;
    }

    try {
      const response = await axios(config);
      return {
        success: response.status < 400,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      if (error.response) {
        return {
          success: false,
          status: error.response.status,
          data: error.response.data,
          error: error.message
        };
      } else if (error.request) {
        return {
          success: false,
          status: 0,
          error: 'Network error - no response from server',
          details: error.message
        };
      } else {
        return {
          success: false,
          status: 0,
          error: 'Request setup error',
          details: error.message
        };
      }
    }
  }

  /**
   * Service-specific methods with caching
   */
  
  async getJobs(filters = {}) {
    const cacheKey = `jobs:${JSON.stringify(filters)}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.request('/api/jobs', {
      method: 'GET',
      params: filters
    });

    if (result.success) {
      await this.setCache(cacheKey, result, 300); // 5 min cache
    }

    return result;
  }

  async createJob(jobData, token) {
    // Invalidate cache
    await this.deleteCache('jobs:*');
    
    return this.request('/api/jobs', {
      method: 'POST',
      data: jobData,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  async getUser(userId, token) {
    const cacheKey = `user:${userId}`;
    const cached = await this.getCache(cacheKey);
    if (cached) return cached;

    const result = await this.request(`/api/users/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (result.success) {
      await this.setCache(cacheKey, result, 600); // 10 min cache
    }

    return result;
  }

  async getCredits(token) {
    return this.request('/api/credits', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Get Redis server information
   */
  async getRedisInfo() {
    try {
      const client = await this.getRedis();
      if (!client) return null;
      
      const info = await client.info();
      // Parse info string into object
      const infoObj = {};
      info.split('\r\n').forEach(line => {
        if (line && !line.startsWith('#') && line.includes(':')) {
          const [key, value] = line.split(':');
          infoObj[key] = value;
        }
      });
      return infoObj;
    } catch (error) {
      console.error('Redis info error:', error);
      return null;
    }
  }

  /**
   * Service discovery
   */
  async discoverServices() {
    const services = await this.getAllServices();
    const health = await this.getHealth();

    return {
      success: true,
      services,
      redis: health
    };
  }
}

// Export singleton instance
module.exports = new ESBService();
