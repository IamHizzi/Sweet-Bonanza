# Sweet Bonanza - Security Documentation

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Threat Model](#threat-model)
4. [Security Controls](#security-controls)
5. [Compliance](#compliance)
6. [Security Checklist](#security-checklist)

---

## Overview

Sweet Bonanza is designed with security as a top priority. This document outlines the security architecture, controls, and best practices for deploying and operating the game in a real-money casino environment.

### Security Principles

1. **Zero Trust** - Never trust client input
2. **Server Authority** - All game logic server-side
3. **Defense in Depth** - Multiple security layers
4. **Least Privilege** - Minimal required permissions
5. **Audit Everything** - Complete transaction logs

---

## Security Architecture

### Client Security (Frontend)

The client is considered **untrusted** and implements these security measures:

#### 1. No Client-Side Game Logic

**CRITICAL**: The client has ZERO game logic:
- ❌ No RNG (Random Number Generator)
- ❌ No win calculation
- ❌ No balance management
- ❌ No symbol generation
- ✅ Only presentation and user interface

**Why**: Any client-side logic can be manipulated by attackers.

#### 2. Request Signing

All requests to the backend are signed using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function signRequest(payload, secretKey) {
  const message = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');

  return signature;
}

// Usage
const request = {
  betAmount: 1.00,
  anteBet: false,
  timestamp: Date.now(),
  requestId: generateUniqueId()
};

request.signature = signRequest(request, SHARED_SECRET);
```

**Protection Against**:
- Request tampering
- Man-in-the-middle attacks
- Replay attacks

#### 3. Response Validation

All responses from the backend are validated:

```javascript
function validateResponse(response, signature, secretKey) {
  const { signature: _, ...payload } = response;
  const expectedSignature = signRequest(payload, secretKey);

  if (signature !== expectedSignature) {
    throw new Error('Invalid response signature - potential tampering');
  }

  return true;
}
```

#### 4. Session Management

```javascript
// Session token stored in memory (NOT localStorage)
let sessionToken = null;

// Auto-refresh before expiration
setInterval(async () => {
  if (isTokenExpiringSoon(sessionToken)) {
    sessionToken = await refreshToken();
  }
}, 60000);

// Clear on logout
function logout() {
  sessionToken = null;
  clearGameState();
}
```

**Never store**:
- Session tokens in localStorage
- Sensitive data in cookies
- API keys in client code

---

### Server Security (Backend)

The backend is the **authority** and must implement:

#### 1. Cryptographically Secure RNG

```python
import secrets
import hmac
import hashlib

class ProvablyFairRNG:
    def __init__(self):
        self.server_seed = secrets.token_hex(32)
        self.client_seed = None
        self.nonce = 0

    def set_client_seed(self, seed):
        """Allow client to provide seed for provable fairness"""
        self.client_seed = seed

    def generate_random(self, min_val, max_val):
        """Generate provably fair random number"""
        combined = f"{self.server_seed}:{self.client_seed}:{self.nonce}"
        hash_value = hmac.new(
            self.server_seed.encode(),
            combined.encode(),
            hashlib.sha256
        ).hexdigest()

        # Convert to number
        random_int = int(hash_value[:8], 16)
        result = min_val + (random_int % (max_val - min_val + 1))

        self.nonce += 1

        return result, hash_value  # Return value and proof

# Usage
rng = ProvablyFairRNG()
rng.set_client_seed(client_provided_seed)

symbol_id, proof = rng.generate_random(0, 10)
```

**Requirements**:
- Use `secrets` module (not `random`)
- Store seeds for verification
- Allow players to verify outcomes
- Change server seed periodically

#### 2. Request Validation

```javascript
async function validateSpinRequest(req) {
  // 1. Validate session
  const session = await validateSessionToken(req.headers.authorization);
  if (!session) {
    throw new Error('Invalid session');
  }

  // 2. Validate signature
  const isValid = validateRequestSignature(req.body, req.body.signature);
  if (!isValid) {
    throw new Error('Invalid request signature');
  }

  // 3. Check timestamp (prevent replay attacks)
  const requestTime = req.body.timestamp;
  const now = Date.now();

  if (Math.abs(now - requestTime) > 60000) { // 60 seconds
    throw new Error('Request expired');
  }

  // 4. Check for duplicate request ID
  const isDuplicate = await checkRequestId(req.body.requestId);
  if (isDuplicate) {
    throw new Error('Duplicate request - replay attack detected');
  }

  // 5. Validate bet amount
  if (req.body.betAmount < MIN_BET || req.body.betAmount > MAX_BET) {
    throw new Error('Invalid bet amount');
  }

  // 6. Check balance
  const balance = await getPlayerBalance(session.playerId);
  if (balance < req.body.betAmount) {
    throw new Error('Insufficient balance');
  }

  return session;
}
```

#### 3. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // Max 10 requests per second
  message: 'Too many requests'
});

// Per-player rate limit
const playerLimiter = rateLimit({
  windowMs: 1000,
  max: 5, // Max 5 spins per second per player
  keyGenerator: (req) => req.session.playerId
});

app.use('/game/spin', playerLimiter);
```

#### 4. Balance Integrity

```javascript
// Use database transactions for atomic balance updates
async function processSpinTransaction(playerId, betAmount, winAmount) {
  const db = await getDatabase();

  try {
    await db.beginTransaction();

    // Lock player balance
    const balance = await db.query(
      'SELECT balance FROM players WHERE id = ? FOR UPDATE',
      [playerId]
    );

    // Deduct bet
    const newBalance = balance - betAmount + winAmount;

    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    // Update balance
    await db.query(
      'UPDATE players SET balance = ? WHERE id = ?',
      [newBalance, playerId]
    );

    // Log transaction
    await db.query(
      'INSERT INTO transactions (player_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
      [playerId, 'spin', -betAmount, newBalance]
    );

    await db.query(
      'INSERT INTO transactions (player_id, type, amount, balance_after) VALUES (?, ?, ?, ?)',
      [playerId, 'win', winAmount, newBalance]
    );

    await db.commit();

    return newBalance;
  } catch (error) {
    await db.rollback();
    throw error;
  }
}
```

---

## Threat Model

### Threats and Mitigations

| Threat | Impact | Mitigation |
|--------|--------|------------|
| **Client-side manipulation** | High | No client-side logic, server authority |
| **Man-in-the-middle** | High | HTTPS, request/response signing |
| **Replay attacks** | High | Request timestamps, unique request IDs |
| **Session hijacking** | High | Secure tokens, HTTPS-only, short expiration |
| **Balance manipulation** | Critical | Database transactions, server-side balance |
| **RNG prediction** | Critical | Cryptographic RNG, provably fair system |
| **DDoS** | Medium | Rate limiting, CDN, load balancing |
| **Injection attacks** | High | Input validation, parameterized queries |
| **XSS** | Medium | Content Security Policy, output encoding |

---

## Security Controls

### 1. Authentication & Authorization

```javascript
// JWT-based authentication
const jwt = require('jsonwebtoken');

function generateSessionToken(playerId, permissions) {
  return jwt.sign(
    {
      playerId,
      permissions,
      iat: Date.now(),
      exp: Date.now() + 3600000 // 1 hour
    },
    process.env.JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

function validateSessionToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check expiration
    if (decoded.exp < Date.now()) {
      throw new Error('Token expired');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 2. Input Validation

```javascript
const Joi = require('joi');

const spinRequestSchema = Joi.object({
  betAmount: Joi.number().min(0.20).max(100.00).required(),
  anteBet: Joi.boolean().required(),
  isFreeSpins: Joi.boolean().required(),
  freeSpinsRemaining: Joi.number().integer().min(0).max(100),
  timestamp: Joi.number().integer().required(),
  requestId: Joi.string().uuid().required(),
  signature: Joi.string().hex().length(64).required()
});

function validateSpinRequest(data) {
  const { error, value } = spinRequestSchema.validate(data);

  if (error) {
    throw new Error(`Invalid request: ${error.message}`);
  }

  return value;
}
```

### 3. Audit Logging

```javascript
async function logGameRound(data) {
  await db.query(`
    INSERT INTO game_rounds (
      round_id,
      player_id,
      bet_amount,
      win_amount,
      grid_result,
      tumbles,
      multipliers,
      free_spins_triggered,
      timestamp,
      ip_address,
      user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.roundId,
    data.playerId,
    data.betAmount,
    data.winAmount,
    JSON.stringify(data.grid),
    JSON.stringify(data.tumbles),
    JSON.stringify(data.multipliers),
    data.freeSpinsTriggered,
    data.timestamp,
    data.ipAddress,
    data.userAgent
  ]);
}
```

### 4. Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.your-casino.com;
  frame-ancestors 'self' https://your-casino.com;
">
```

---

## Compliance

### Regulatory Requirements

#### 1. GLI-19 Compliance

- ✅ Cryptographically secure RNG
- ✅ Game outcome storage (minimum 90 days)
- ✅ Player transaction history
- ✅ Audit trail for all events
- ✅ Game fairness verification

#### 2. Responsible Gaming

```javascript
// Session time limits
function checkSessionDuration(sessionStart) {
  const duration = Date.now() - sessionStart;

  if (duration > 3600000) { // 1 hour
    return {
      warning: 'You have been playing for 1 hour. Please take a break.',
      showRealityCheck: true
    };
  }

  return { warning: null };
}

// Loss limits
function checkLossLimit(playerId, currentLoss) {
  const limits = getPlayerLimits(playerId);

  if (currentLoss >= limits.dailyLoss) {
    return {
      blocked: true,
      message: 'Daily loss limit reached. Play will resume tomorrow.'
    };
  }

  return { blocked: false };
}
```

#### 3. GDPR Compliance

- ✅ Data minimization
- ✅ Right to access data
- ✅ Right to erasure
- ✅ Data encryption at rest
- ✅ Consent management

---

## Security Checklist

### Deployment Checklist

- [ ] Enable HTTPS everywhere
- [ ] Configure strong CSP headers
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Enable HSTS (HTTP Strict Transport Security)
- [ ] Configure rate limiting
- [ ] Enable request/response signing
- [ ] Set up audit logging
- [ ] Configure session timeouts
- [ ] Enable database encryption
- [ ] Set up backup and recovery
- [ ] Configure monitoring and alerts
- [ ] Perform security audit
- [ ] Penetration testing
- [ ] Code review

### Operational Checklist

- [ ] Monitor for suspicious activity
- [ ] Review audit logs regularly
- [ ] Update dependencies regularly
- [ ] Rotate secrets periodically
- [ ] Backup database daily
- [ ] Test disaster recovery
- [ ] Review access controls
- [ ] Monitor RTP compliance
- [ ] Check for abnormal betting patterns
- [ ] Verify game fairness

---

## Incident Response

### Security Incident Procedure

1. **Detection** - Monitor alerts, logs
2. **Containment** - Isolate affected systems
3. **Investigation** - Analyze attack vector
4. **Eradication** - Remove threat
5. **Recovery** - Restore normal operations
6. **Post-mortem** - Document and improve

### Emergency Contacts

- Security Team: security@your-company.com
- On-call Engineer: +1-XXX-XXX-XXXX
- Compliance Officer: compliance@your-company.com

---

## Security Best Practices

### For Developers

1. **Never trust client input** - Always validate server-side
2. **Use parameterized queries** - Prevent SQL injection
3. **Sanitize output** - Prevent XSS
4. **Keep secrets secret** - Use environment variables
5. **Log everything** - But not sensitive data
6. **Fail securely** - Default deny, explicit allow
7. **Update dependencies** - Patch vulnerabilities
8. **Code review** - Peer review all changes

### For Operators

1. **Monitor continuously** - Real-time alerts
2. **Backup regularly** - Test restores
3. **Rotate credentials** - Periodic secret changes
4. **Audit access** - Review who has access
5. **Encrypt data** - At rest and in transit
6. **Plan for incidents** - Have a response plan
7. **Train staff** - Security awareness
8. **Test security** - Regular penetration tests

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GLI-19 Standards](https://gaminglabs.com/gli-19)
- [PCI DSS](https://www.pcisecuritystandards.org/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Contact

For security issues or vulnerabilities:

- **Security Email**: security@your-company.com
- **PGP Key**: [Your PGP Key]
- **Bug Bounty**: https://your-company.com/security/bug-bounty

**Please do not disclose security vulnerabilities publicly until they have been addressed.**
