let Keycloak, MemoryStore;

try {
  Keycloak = require('keycloak-connect');
  const memorystore = require('memorystore');
  const session = require('express-session');
  MemoryStore = memorystore(session);
} catch (error) {
  console.warn('Keycloak dependencies not installed. Run: npm install keycloak-connect express-session memorystore');
  Keycloak = null;
  MemoryStore = null;
}

/**
 * Keycloak Configuration
 * 
 * Configure Keycloak connection settings here.
 * For production, use environment variables.
 */

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'egseekers-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MemoryStore ? new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }) : undefined,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Keycloak configuration
const keycloakConfig = {
  serverUrl: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'egseekers',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'egseekers-backend',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  bearerOnly: process.env.KEYCLOAK_BEARER_ONLY === 'true' || false, // false = interactive login, true = API only
  publicClient: process.env.KEYCLOAK_PUBLIC_CLIENT === 'true' || true, // true if no client secret
};

// Initialize Keycloak
let keycloak;

function initKeycloak(memoryStore) {
  if (!Keycloak) {
    console.warn('Keycloak not available. Install dependencies: npm install keycloak-connect express-session memorystore');
    return null;
  }
  
  if (!keycloak && memoryStore) {
    keycloak = new Keycloak(
      { store: memoryStore },
      keycloakConfig
    );
  }
  return keycloak;
}

// Middleware to protect routes with Keycloak
function keycloakProtect() {
  return (req, res, next) => {
    if (!keycloak) {
      console.error('Keycloak not initialized');
      return res.status(500).json({ error: 'Keycloak not configured' });
    }
    return keycloak.protect()(req, res, next);
  };
}

// Middleware to check if user is authenticated (doesn't redirect)
function keycloakAuthenticated() {
  return (req, res, next) => {
    if (!keycloak) {
      return next(); // Fallback to custom auth if Keycloak not configured
    }
    
    // Check if request has valid Keycloak token
    if (req.kauth && req.kauth.grant) {
      return next();
    }
    
    // If no Keycloak auth, fallback to custom auth
    return next();
  };
}

module.exports = {
  sessionConfig,
  keycloakConfig,
  initKeycloak,
  keycloakProtect,
  keycloakAuthenticated,
  getKeycloak: () => keycloak,
};

