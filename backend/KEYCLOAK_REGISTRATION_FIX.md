# Keycloak Registration Fix

## Problem
When registering with Keycloak, users get the error:
"Unexpected error when handling authentication request to identity provider."

## Root Cause
Keycloak has a bug with `kc_action=REGISTER` parameter that causes a `NullPointerException` related to `RequiredActionProvider.getMaxAuthAge()`.

## Solution
Use the registration endpoint directly instead of the auth endpoint with `kc_action=REGISTER`.

### Changed URL Format:
**Before (causing error):**
```
/realms/{realm}/protocol/openid-connect/auth?kc_action=REGISTER&...
```

**After (working):**
```
/realms/{realm}/protocol/openid-connect/registrations?...
```

## Keycloak Client Configuration

Make sure your Keycloak client `egseekers-backend` has these settings:

1. **Valid Redirect URIs:**
   - `http://localhost:5001/api/keycloak/callback`
   - `http://localhost:5001/*`
   - `http://localhost:3000/*` (for frontend callbacks)

2. **Web Origins:**
   - `http://localhost:3000`
   - `http://localhost:5001`

3. **Settings:**
   - Public client: `ON`
   - Direct Access Grants Enabled: `ON` (for direct login)
   - Standard Flow Enabled: `ON`
   - Implicit Flow Enabled: `OFF`

## How to Verify

1. Check redirect URI is configured:
   ```bash
   # Should return 200
   curl -I "http://localhost:8080/realms/egseekers/protocol/openid-connect/registrations?client_id=egseekers-backend&redirect_uri=http://localhost:5001/api/keycloak/callback"
   ```

2. Test registration flow:
   - Go to registration page
   - Fill in form
   - Should redirect to Keycloak registration page (not login page)
   - After registration, should redirect back to backend callback
   - Backend processes and redirects to frontend with token

## Troubleshooting

If you still get errors:

1. **Check Keycloak logs:**
   ```bash
   docker logs keycloak --tail 50 | grep -i error
   ```

2. **Verify redirect URI matches exactly:**
   - Must match what's configured in Keycloak Admin Console
   - Check for trailing slashes
   - Check protocol (http vs https)

3. **Check required actions:**
   - Go to Keycloak Admin Console → Realm Settings → Required Actions
   - Make sure "User registration" is enabled
   - Disable email verification if not needed for testing

4. **Clear browser cookies:**
   - Keycloak might have stale session data
   - Clear cookies for localhost:8080

