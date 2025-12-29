# Sweet Bonanza - HTML5 Cluster Slot Game

<div align="center">

**Production-Grade HTML5 Slot Game Inspired by Pragmatic Play's Sweet Bonanza**

[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![Phaser](https://img.shields.io/badge/Phaser-3.80-blue.svg)](https://phaser.io/)
[![RTP](https://img.shields.io/badge/RTP-96.51%25-green.svg)](#)
[![Volatility](https://img.shields.io/badge/Volatility-High-orange.svg)](#)

[Features](#features) • [Quick Start](#quick-start) • [Integration](#integration) • [Documentation](#documentation) • [Security](#security)

</div>

---

## Overview

Sweet Bonanza is a **production-ready HTML5 cluster-pay slot game** designed for real-money casino environments. Built with industry-leading standards, it features:

- **6x5 Grid Layout** with cluster-pay mechanics (8+ matching symbols)
- **Tumble/Cascade Feature** - Winning symbols explode and new ones drop
- **Free Spins Bonus** - 4+ scatters trigger 10 free spins
- **Multiplier System** - Random 2x-100x multipliers that accumulate in free spins
- **Ante Bet Feature** - 25% cost increase for 2x scatter chance
- **100% Server-Controlled** - No client-side RNG or game logic
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Casino-Grade Security** - HMAC signing, request validation, anti-tampering

---

## Features

### Game Mechanics

✅ **Cluster Pays** - Win with 8+ adjacent matching symbols
✅ **Tumble Feature** - Continuous wins with cascading symbols
✅ **Free Spins** - Trigger with 4+ scatters (10 spins)
✅ **Multipliers** - 2x to 100x random multipliers
✅ **Ante Bet** - Increase scatter chance by 25% bet cost
✅ **Autoplay** - Multiple spin options with stop conditions

### Technical Features

🔒 **Security**
- No client-side RNG (100% server-controlled)
- HMAC-SHA256 request/response signing
- Session validation and token-based auth
- Anti-replay attack protection
- Request timestamping and validation

⚡ **Performance**
- Built with Phaser 3 (WebGL/Canvas renderer)
- Optimized animations (60 FPS)
- Asset compression and lazy loading
- CDN-ready static bundle
- < 2MB total bundle size

📱 **Responsive**
- Adaptive layout for all screen sizes
- Touch controls for mobile
- Portrait and landscape support
- Retina display optimization

🎨 **UI/UX**
- Smooth animations and transitions
- Win celebrations (Normal, Big, Mega)
- Free spins trigger animations
- Balance and bet displays
- Autoplay controls

🎵 **Audio**
- Background music
- SFX for spins, wins, tumbles
- Multiplier and scatter sounds
- Volume controls
- Mute functionality

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API implementing the [API Specification](./docs/API_SPECIFICATION.md)

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

The game will open at `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to your CDN
```

---

## Integration

### Embed via IFrame

The simplest integration method:

```html
<iframe
  src="https://your-cdn.com/sweet-bonanza/?playerId=123&mode=real"
  width="1280"
  height="720"
  frameborder="0"
  allowfullscreen
></iframe>
```

### JavaScript Integration

```javascript
import initGame from './sweet-bonanza/main.js';

const game = initGame({
  apiBaseURL: 'https://api.your-casino.com',
  apiKey: 'your_api_key',
  playerId: '12345',
  gameMode: 'real', // or 'demo'
  currency: 'USD'
});

// Listen to events
game.events.on('win', (data) => {
  console.log('Win:', data.amount);
});
```

For detailed integration instructions, see [Integration Guide](./docs/INTEGRATION_GUIDE.md).

---

## Architecture

### Project Structure

```
sweet-bonanza/
├── src/
│   ├── api/
│   │   └── GameAPI.js           # Backend API integration
│   ├── config/
│   │   └── GameConfig.js        # Game configuration
│   ├── core/
│   │   ├── GridManager.js       # Grid and symbol management
│   │   └── GameStateManager.js  # Game state and logic
│   ├── scenes/
│   │   └── GameScene.js         # Main Phaser scene
│   ├── ui/
│   │   └── GameUI.js            # UI components
│   ├── utils/
│   │   ├── SymbolManager.js     # Symbol rendering
│   │   └── AudioManager.js      # Audio system
│   └── main.js                  # Entry point
├── docs/
│   ├── API_SPECIFICATION.md     # Backend API spec
│   └── INTEGRATION_GUIDE.md     # Integration guide
├── index.html                   # HTML entry
├── package.json
└── vite.config.js              # Build configuration
```

### Data Flow

```
Player Action → Frontend → Backend API → RNG Engine
                  ↓            ↓            ↓
              UI Update ← Response ← Game Outcome
```

**Key Principle:** All game logic (RNG, outcomes, wins) happens server-side. The client is a presentation layer only.

---

## Documentation

### For Developers

- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** - How to integrate into your platform
- **[API Specification](./docs/API_SPECIFICATION.md)** - Backend API requirements

### For Backend Engineers

The backend must implement:

1. **Session Management** - Create/end game sessions
2. **RNG Engine** - Generate random outcomes
3. **Game Logic** - Cluster detection, tumbles, wins
4. **Balance Management** - Deduct bets, credit wins
5. **Security** - Request signing, validation, anti-fraud

See [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) for complete requirements.

---

## Security

### Client-Side Security

✅ **No RNG** - All randomness server-side
✅ **Request Signing** - HMAC-SHA256 signatures
✅ **Response Validation** - Verify server signatures
✅ **Session Tokens** - JWT-based authentication
✅ **Timestamp Validation** - Reject old requests
✅ **Rate Limiting** - Prevent spam/abuse

### Backend Security Requirements

🔒 **Cryptographic RNG** - Use crypto-secure random
🔒 **Provably Fair** - Store seeds for verification
🔒 **Audit Logging** - Log all game rounds
🔒 **Balance Integrity** - Validate on every transaction
🔒 **Anti-Fraud** - Monitor suspicious patterns

### Compliance

Designed to meet:

- **GLI-19** - Gaming standards
- **ISO/IEC 27001** - Security management
- **Responsible Gaming** - Session limits, reality checks
- **Jurisdiction Requirements** - Malta, UK, Curacao, etc.

---

## Game Configuration

Edit `src/config/GameConfig.js` to customize game settings, bet levels, animations, and more.

---

## API Integration

### Initialize Session

```javascript
POST /game/init
{
  "playerId": "12345",
  "currency": "USD",
  "gameMode": "real"
}

Response:
{
  "sessionToken": "jwt_token",
  "balance": 1000.00,
  "currency": "USD"
}
```

### Request Spin

```javascript
POST /game/spin
{
  "betAmount": 1.00,
  "anteBet": false,
  "isFreeSpins": false
}

Response:
{
  "spinId": "unique_id",
  "grid": [[0,1,2,3,4], ...],  // 6x5 symbol IDs
  "tumbles": [...],             // Tumble sequence
  "winData": {
    "totalWin": 50.00,
    "clusters": [...],
    "multipliers": [5, 10]
  },
  "balance": 1050.00
}
```

See [API_SPECIFICATION.md](./docs/API_SPECIFICATION.md) for full documentation.

---

## Symbol Reference

| ID | Symbol | Type | Value |
|----|--------|------|-------|
| 0 | 🍌 Banana | High | 50x |
| 1 | 🍇 Grapes | High | 40x |
| 2 | 🍉 Watermelon | High | 35x |
| 3 | 🍑 Plum | High | 30x |
| 4 | 🍎 Apple | High | 25x |
| 5 | 💗 Heart Candy | Low | 10x |
| 6 | 🔷 Square Candy | Low | 8x |
| 7 | ⭐ Star Candy | Low | 6x |
| 8 | 🔺 Triangle Candy | Low | 5x |
| 9 | 🍭 Lollipop | Scatter | - |
| 10 | 💣 Bomb | Multiplier | 2x-100x |

---

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

---

## Deployment

### CDN Deployment

```bash
# Build
npm run build

# Upload to CDN
aws s3 sync dist/ s3://your-bucket/sweet-bonanza/ --acl public-read
```

### Vercel/Netlify

```bash
# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Mobile Safari | 14+ |
| Chrome Android | 90+ |

---

## License

**Proprietary - All Rights Reserved**

Copyright (c) 2024 Your Casino Company

---

## Support

For support and inquiries:

- **Email**: support@your-company.com
- **Documentation**: [docs/](./docs/)
- **Issues**: GitHub Issues

---

## Acknowledgments

Inspired by **Pragmatic Play's Sweet Bonanza**, reimagined for modern web platforms with casino-grade security and performance.

Built with ❤️ by the Casino Game Engineering Team
