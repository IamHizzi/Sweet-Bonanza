# Sweet Bonanza - Backend API Specification

## Overview

This document specifies the required backend API endpoints for the Sweet Bonanza HTML5 slot game. The game client has **NO** client-side RNG or game logic. All outcomes, wins, and random events are controlled server-side.

## Security Requirements

### Request Signing
All requests must be signed using HMAC-SHA256:
```
signature = HMAC-SHA256(secret_key, request_payload)
```

### Response Validation
All responses must include a signature for client verification:
```
signature = HMAC-SHA256(secret_key, response_payload)
```

### Required Headers
```
X-API-Key: {api_key}
Authorization: Bearer {session_token}
X-Game-Type: sweet-bonanza
X-Game-Version: 1.0.0
Content-Type: application/json
```

---

## API Endpoints

### 1. Initialize Game Session

**Endpoint:** `POST /game/init`

**Description:** Creates a new game session for a player.

**Request:**
```json
{
  "playerId": "string",
  "currency": "USD",
  "gameMode": "real|demo",
  "locale": "en"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "unique_session_id",
  "sessionToken": "jwt_token_for_auth",
  "playerId": "player_id",
  "balance": 1000.00,
  "currency": "USD",
  "playerData": {
    "username": "player_name",
    "vipLevel": 1
  },
  "timestamp": 1234567890,
  "signature": "hmac_signature"
}
```

**Error Responses:**
- `400`: Invalid request parameters
- `403`: Player not authorized
- `500`: Server error

---

### 2. Request Spin

**Endpoint:** `POST /game/spin`

**Description:** Request a spin outcome. Server generates all results including symbols, wins, tumbles, and features.

**Request:**
```json
{
  "betAmount": 1.00,
  "anteBet": false,
  "isFreeSpins": false,
  "freeSpinsRemaining": 0,
  "accumulatedMultiplier": 1,
  "timestamp": 1234567890,
  "requestId": "unique_request_id",
  "signature": "hmac_signature"
}
```

**Response:**
```json
{
  "spinId": "unique_spin_id",
  "roundId": "round_identifier",

  "grid": [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 0],
    [1, 2, 3, 4, 5],
    [6, 7, 8, 0, 1],
    [2, 3, 4, 5, 6],
    [7, 8, 0, 1, 2]
  ],

  "tumbles": [
    {
      "tumbleIndex": 0,
      "clusters": [
        {
          "symbolId": 0,
          "positions": [
            {"col": 0, "row": 0},
            {"col": 0, "row": 1},
            {"col": 1, "row": 0}
          ],
          "size": 3
        }
      ],
      "multipliers": [
        {"col": 2, "row": 3, "value": 5}
      ],
      "winAmount": 5.00,
      "multiplier": 5,
      "removePositions": [
        {"col": 0, "row": 0},
        {"col": 0, "row": 1}
      ],
      "newSymbols": [
        {"col": 0, "row": 0, "symbolId": 3},
        {"col": 0, "row": 1, "symbolId": 4}
      ]
    }
  ],

  "winData": {
    "clusters": [...],
    "totalWin": 50.00,
    "multipliers": [5, 10, 2],
    "finalMultiplier": 17
  },

  "freeSpins": {
    "triggered": true,
    "remaining": 10,
    "totalAwarded": 10,
    "retriggered": false
  },

  "balance": 1050.00,
  "timestamp": 1234567890,
  "signature": "hmac_signature"
}
```

**Symbol IDs:**
```
0: BANANA
1: GRAPES
2: WATERMELON
3: PLUM
4: APPLE
5: HEART_CANDY
6: SQUARE_CANDY
7: STAR_CANDY
8: TRIANGLE_CANDY
9: LOLLIPOP (Scatter)
10: BOMB (Multiplier)
```

**Game Logic Requirements:**
1. **Grid Generation**: 6x5 grid with random symbols
2. **Cluster Detection**: Find clusters of 8+ matching adjacent symbols
3. **Tumble Mechanics**: Remove winning symbols, drop new ones, repeat until no wins
4. **Multipliers**: Randomly place multiplier symbols (2x-100x)
5. **Free Spins**: Trigger on 4+ scatter symbols
6. **Ante Bet**: Double scatter appearance rate when enabled
7. **RTP**: Maintain configured RTP (e.g., 96.51%)

**Error Responses:**
- `400`: Invalid bet amount or parameters
- `401`: Session expired
- `403`: Insufficient balance
- `500`: Server error

---

### 3. Get Balance

**Endpoint:** `GET /game/balance`

**Description:** Retrieve current player balance.

**Response:**
```json
{
  "balance": 1000.00,
  "currency": "USD",
  "timestamp": 1234567890
}
```

---

### 4. Get Game History

**Endpoint:** `GET /game/history?limit=50`

**Description:** Retrieve recent game rounds.

**Response:**
```json
{
  "history": [
    {
      "roundId": "round_id",
      "timestamp": 1234567890,
      "betAmount": 1.00,
      "winAmount": 10.00,
      "gameType": "base|freespins"
    }
  ]
}
```

---

### 5. End Session

**Endpoint:** `POST /game/end`

**Description:** End current game session.

**Response:**
```json
{
  "success": true,
  "sessionSummary": {
    "totalSpins": 100,
    "totalWagered": 100.00,
    "totalWon": 95.00,
    "netResult": -5.00,
    "sessionDuration": 3600
  }
}
```

---

### 6. Heartbeat

**Endpoint:** `POST /game/heartbeat`

**Description:** Keep session alive (called every 30 seconds).

**Response:**
```json
{
  "success": true,
  "timestamp": 1234567890
}
```

---

## Game Logic Specifications

### Cluster Detection Algorithm

1. Use flood-fill to find connected symbols
2. Only horizontal and vertical adjacency counts
3. Minimum cluster size: 8 symbols
4. Scatter and multiplier symbols don't form clusters

### Tumble Sequence

1. Check for winning clusters
2. If wins found:
   - Mark winning symbols for removal
   - Calculate win amount
   - Apply multipliers if present
   - Remove symbols
   - Drop new symbols from top
   - Repeat from step 1
3. If no wins, end tumble sequence

### Multiplier System

**Base Game:**
- Random multipliers: 2x, 3x, 4x, 5x, 6x, 7x, 8x, 9x, 10x, 12x, 15x, 20x, 25x, 50x, 100x
- Do not accumulate

**Free Spins:**
- Same multiplier values
- Accumulate throughout free spins session
- Reset when free spins end

### Free Spins

**Trigger:**
- 4+ scatter symbols anywhere on grid
- Awards 10 free spins

**Retrigger:**
- 3+ scatter symbols during free spins
- Awards 5 additional spins

**Ante Bet:**
- Costs 25% extra (1.25x bet)
- Doubles scatter appearance rate

### RTP Configuration

**Target RTP:** 96.51%

**Volatility:** High

**Max Win:** 21,100x bet

**Hit Frequency:** ~21.5% (adjust based on math model)

---

## Security Considerations

### Request Validation

1. Validate session token on every request
2. Verify request signature
3. Check request timestamp (reject if > 60 seconds old)
4. Validate bet amount against player balance
5. Rate limit requests (max 10 spins/second)

### Response Integrity

1. Sign all responses
2. Include unique spin/round IDs
3. Store all game rounds for audit
4. Log all transactions

### Anti-Tampering

1. Never trust client-provided random values
2. Validate all client state against server state
3. Detect and block replay attacks
4. Monitor for suspicious patterns

### Fair Play

1. Use cryptographically secure RNG
2. Maintain provably fair game rounds
3. Allow players to verify outcomes
4. Store seeds for audit

---

## Testing Requirements

### Unit Tests

- RNG distribution
- Cluster detection
- Tumble logic
- Multiplier calculation
- Balance updates

### Integration Tests

- Full spin sequences
- Free spins triggers
- Session management
- Error handling

### Load Tests

- 1000 concurrent sessions
- 10 spins/second per session
- Response time < 100ms

### Regulatory Compliance

- GLI-19 certification
- eCOGRA certification
- Jurisdiction-specific requirements

---

## Example Implementation (Pseudocode)

```python
def process_spin(bet_amount, ante_bet, is_free_spins, accumulated_multiplier):
    # Deduct bet from balance
    if not is_free_spins:
        balance -= bet_amount * (1.25 if ante_bet else 1)

    # Generate initial grid
    grid = generate_random_grid(ante_bet)

    # Process tumbles
    tumbles = []
    total_win = 0
    current_grid = grid

    while True:
        clusters = detect_clusters(current_grid)

        if not clusters:
            break

        # Calculate win
        win_amount = calculate_win(clusters, bet_amount)

        # Apply multipliers
        multipliers = get_multipliers(current_grid)
        multiplier_value = sum(m.value for m in multipliers)

        if is_free_spins:
            accumulated_multiplier += multiplier_value
            win_amount *= accumulated_multiplier
        else:
            win_amount *= multiplier_value

        total_win += win_amount

        # Record tumble
        tumbles.append({
            'clusters': clusters,
            'multipliers': multipliers,
            'winAmount': win_amount
        })

        # Remove winning symbols and generate new ones
        current_grid = apply_tumble(current_grid, clusters)

    # Check for free spins trigger
    scatter_count = count_scatters(grid)
    free_spins_triggered = scatter_count >= 4

    # Update balance
    balance += total_win

    return {
        'grid': grid,
        'tumbles': tumbles,
        'totalWin': total_win,
        'freeSpinsTriggered': free_spins_triggered,
        'balance': balance
    }
```

---

## Compliance & Certification

This API must comply with:

- **GLI-19**: RNG requirements
- **ISO/IEC 27001**: Security standards
- **Gaming jurisdiction requirements**: Malta, UK, Curacao, etc.
- **Responsible Gaming**: Session limits, reality checks, loss limits

---

## Support

For backend integration support:
- Email: integration@example.com
- Documentation: https://docs.example.com/sweet-bonanza
- Slack: #sweet-bonanza-integration
