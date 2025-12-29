# Sweet Bonanza - Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Embedding the Game](#embedding-the-game)
4. [Backend Integration](#backend-integration)
5. [Configuration](#configuration)
6. [Security](#security)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Overview

Sweet Bonanza is a production-grade HTML5 cluster-pay slot game that can be embedded into any casino platform. The game is built with:

- **Phaser 3**: High-performance HTML5 game framework
- **Vite**: Modern build tool for fast development
- **100% Server-Controlled**: No client-side RNG or game logic
- **Responsive**: Works on desktop, tablet, and mobile
- **Secure**: Request signing, response validation, anti-tampering

---

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/sweet-bonanza.git
cd sweet-bonanza

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev
```

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment.

---

## Embedding the Game

### Option 1: IFrame Embedding

The simplest way to integrate Sweet Bonanza into your platform:

```html
<iframe
  src="https://your-cdn.com/sweet-bonanza/index.html?playerId=12345&mode=real"
  width="1280"
  height="720"
  frameborder="0"
  allowfullscreen
  style="border: none; max-width: 100%;"
></iframe>
```

### Option 2: Direct Integration

Include the game directly in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Sweet Bonanza</title>
  <script type="module" src="/sweet-bonanza/main.js"></script>
</head>
<body>
  <div id="game-container"></div>
</body>
</html>
```

### Option 3: JavaScript API

Programmatically initialize the game:

```javascript
import initGame from './sweet-bonanza/main.js';

// Initialize with custom configuration
const game = initGame({
  apiBaseURL: 'https://api.your-casino.com',
  apiKey: 'your_api_key',
  playerId: '12345',
  gameMode: 'real', // or 'demo'
  currency: 'USD',
  locale: 'en'
});

// Listen to game events
game.events.on('win', (data) => {
  console.log('Player won:', data.amount);
});

game.events.on('balanceUpdate', (data) => {
  console.log('Balance updated:', data.balance);
});
```

---

## Backend Integration

### Required API Endpoints

Your backend must implement these endpoints (see [API_SPECIFICATION.md](./API_SPECIFICATION.md) for full details):

1. **POST /game/init** - Initialize game session
2. **POST /game/spin** - Request spin outcome
3. **GET /game/balance** - Get player balance
4. **GET /game/history** - Get game history
5. **POST /game/end** - End game session
6. **POST /game/heartbeat** - Keep session alive

### Example Backend (Node.js/Express)

```javascript
const express = require('express');
const app = express();

// Initialize session
app.post('/game/init', async (req, res) => {
  const { playerId, currency, gameMode } = req.body;

  // Create session in your database
  const session = await createGameSession(playerId, gameMode);

  res.json({
    success: true,
    sessionId: session.id,
    sessionToken: generateJWT(session),
    playerId: playerId,
    balance: await getPlayerBalance(playerId),
    currency: currency,
    timestamp: Date.now(),
    signature: generateSignature(responseData)
  });
});

// Process spin
app.post('/game/spin', async (req, res) => {
  const { betAmount, anteBet, isFreeSpins } = req.body;

  // Validate session
  const session = await validateSession(req.headers.authorization);

  // Generate game outcome using your RNG
  const outcome = await generateSpinOutcome({
    betAmount,
    anteBet,
    isFreeSpins,
    rtp: 96.51,
    volatility: 'high'
  });

  // Update player balance
  await updateBalance(session.playerId, outcome.balance);

  // Store game round for audit
  await storeGameRound(outcome);

  res.json({
    spinId: outcome.spinId,
    grid: outcome.grid,
    tumbles: outcome.tumbles,
    winData: outcome.winData,
    freeSpins: outcome.freeSpins,
    balance: outcome.balance,
    timestamp: Date.now(),
    signature: generateSignature(outcome)
  });
});
```

### RNG Implementation

Your backend RNG must:

1. Use cryptographically secure random number generator
2. Be provably fair (store seeds, allow verification)
3. Maintain configured RTP (e.g., 96.51%)
4. Be independently tested and certified

**Example RNG (Conceptual):**

```javascript
const crypto = require('crypto');

function generateRandomGrid(anteBet = false) {
  const grid = [];
  const symbolWeights = getSymbolWeights(anteBet);

  for (let col = 0; col < 6; col++) {
    grid[col] = [];
    for (let row = 0; row < 5; row++) {
      grid[col][row] = weightedRandom(symbolWeights);
    }
  }

  return grid;
}

function getSymbolWeights(anteBet) {
  // Adjust weights based on RTP model
  return {
    0: 100,  // BANANA
    1: 100,  // GRAPES
    2: 120,  // WATERMELON
    3: 120,  // PLUM
    4: 140,  // APPLE
    5: 200,  // HEART_CANDY
    6: 220,  // SQUARE_CANDY
    7: 240,  // STAR_CANDY
    8: 260,  // TRIANGLE_CANDY
    9: anteBet ? 40 : 20,  // LOLLIPOP (scatter)
    10: 60   // BOMB (multiplier)
  };
}

function weightedRandom(weights) {
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = crypto.randomInt(0, totalWeight);

  for (const [symbolId, weight] of Object.entries(weights)) {
    if (random < weight) {
      return parseInt(symbolId);
    }
    random -= weight;
  }
}
```

---

## Configuration

### Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://api.your-casino.com/api/v1
VITE_API_KEY=your_api_key_here

# Game Mode
VITE_GAME_MODE=production

# Debug Mode (disable in production)
VITE_DEBUG_MODE=false

# Analytics
VITE_ANALYTICS_ID=GA-XXXXXXXXX
VITE_TRACKING_ENABLED=true
```

### Game Configuration

Edit `src/config/GameConfig.js` to customize:

- Bet levels and limits
- Animation timings
- Autoplay settings
- Responsible gaming features
- Audio settings

**Example:**

```javascript
export const GameConfig = {
  BET_SETTINGS: {
    MIN_BET: 0.20,
    MAX_BET: 100.00,
    DEFAULT_BET: 1.00,
    BET_LEVELS: [0.20, 0.40, 0.60, 0.80, 1.00, 2.00, 5.00, 10.00]
  },

  ANIMATIONS: {
    SYMBOL_DROP: 100,      // Symbol drop speed (ms)
    WIN_HIGHLIGHT: 800,    // Win highlight duration
    TUMBLE_DELAY: 400      // Delay between tumbles
  },

  RESPONSIBLE_GAMING: {
    SESSION_REMINDER_INTERVAL: 3600000, // 1 hour
    REALITY_CHECK: true
  }
};
```

---

## Security

### Request Signing

All requests to your backend are signed using HMAC-SHA256:

```javascript
import crypto from 'crypto';

function generateSignature(data, secretKey) {
  const payload = JSON.stringify(data);
  return crypto
    .createHmac('sha256', secretKey)
    .update(payload)
    .digest('hex');
}

// Client sends
const requestData = {
  betAmount: 1.00,
  anteBet: false,
  timestamp: Date.now()
};

const signature = generateSignature(requestData, SECRET_KEY);

axios.post('/game/spin', {
  ...requestData,
  signature
});
```

### Response Validation

The client validates all responses:

```javascript
function validateResponseSignature(responseData, signature, secretKey) {
  const { signature: _, ...data } = responseData;
  const expectedSignature = generateSignature(data, secretKey);

  return signature === expectedSignature;
}
```

### Anti-Tampering Measures

1. **No client-side RNG**: All randomness server-side
2. **Request timestamps**: Reject old requests (>60s)
3. **Unique request IDs**: Prevent replay attacks
4. **Session validation**: Check token on every request
5. **Rate limiting**: Max 10 spins/second

---

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Load Testing

Use tools like Apache JMeter or k6:

```javascript
// k6 load test script
import http from 'k6/http';

export default function() {
  // Simulate 1000 concurrent players
  const res = http.post('https://api.your-casino.com/game/spin', {
    betAmount: 1.00,
    anteBet: false
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100
  });
}
```

---

## Deployment

### CDN Deployment

1. Build production bundle:
```bash
npm run build
```

2. Upload `dist/` folder to your CDN:
```bash
aws s3 sync dist/ s3://your-bucket/sweet-bonanza/ --acl public-read
```

3. Configure CDN caching:
- Cache static assets (JS, CSS, images): 1 year
- Cache index.html: No cache
- Enable gzip/brotli compression

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sweet-bonanza
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sweet-bonanza
  template:
    metadata:
      labels:
        app: sweet-bonanza
    spec:
      containers:
      - name: sweet-bonanza
        image: your-registry/sweet-bonanza:latest
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_BASE_URL
          value: "https://api.your-casino.com"
```

---

## URL Parameters

The game accepts these URL parameters:

- `playerId` - Player identifier
- `mode` - Game mode (`real` or `demo`)
- `currency` - Currency code (e.g., `USD`, `EUR`)
- `locale` - Language code (e.g., `en`, `es`, `pt`)
- `sessionToken` - Pre-authenticated session token

**Example:**
```
https://your-cdn.com/sweet-bonanza/?playerId=12345&mode=real&currency=USD&locale=en
```

---

## Monitoring

### Recommended Metrics

1. **Performance**
   - Page load time
   - Time to interactive
   - Frame rate (should be 60 FPS)
   - API response times

2. **Business**
   - Total spins
   - Total wagered
   - Total won
   - RTP (actual vs. theoretical)
   - Average session duration

3. **Errors**
   - API errors
   - Network errors
   - JavaScript errors
   - Session timeouts

### Example Monitoring (DataDog)

```javascript
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'your-app-id',
  clientToken: 'your-client-token',
  service: 'sweet-bonanza',
  env: 'production',
  version: '1.0.0',
  trackInteractions: true,
  trackResources: true
});

// Track custom events
game.events.on('spin', () => {
  datadogRum.addAction('spin');
});

game.events.on('win', (data) => {
  datadogRum.addAction('win', {
    amount: data.amount,
    type: data.type
  });
});
```

---

## Support

For integration support:

- **Documentation**: [docs/](./docs/)
- **Email**: support@your-company.com
- **Slack**: #sweet-bonanza-integration
- **Issue Tracker**: GitHub Issues

---

## License

Proprietary - All Rights Reserved

Copyright (c) 2024 Your Casino Company
