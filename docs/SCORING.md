# Pichichi - Scoring System

## Match Predictions

Users predict the final score (e.g., Argentina 2 - 1 Brasil) for each match before kickoff.

### Point Types

| Result | Points | Example |
|--------|--------|---------|
| **Exact score** | 5 pts x multiplier | Predicted 2-1, actual 2-1 |
| **Goal difference** | 3 pts x multiplier | Predicted 3-1, actual 2-0 (same diff: 2) |
| **Correct winner/draw** | 1 pt x multiplier | Predicted 2-0, actual 1-0 (same winner) |
| **Miss** | 0 pts | Predicted 2-0, actual 0-1 |

### Phase Multipliers

Points are multiplied based on the tournament phase:

| Phase | Multiplier | Max points (exact) |
|-------|------------|-------------------|
| Group Stage | x1 | 5 pts |
| Round of 32 | x2 | 10 pts |
| Round of 16 | x2 | 10 pts |
| Quarter Finals | x3 | 15 pts |
| Semi Finals | x3 | 15 pts |
| Third Place | x3 | 15 pts |
| Final | x3 | 15 pts |

> Multipliers are configurable per tournament via the `TournamentPhase` table.

### Extra Time and Penalties

- **Score used for points**: The 90min + extra time score (NOT penalty shootout score)
- **Example**: Match ends 1-1 after 90min, goes to extra time, finishes 2-2, penalties 4-3.
  - Score for prediction purposes: **2-2**
  - If you predicted 2-2, you get EXACT points
  - Penalty results are only used to determine the match winner (for bracket progression)

## Bonus Predictions

Special predictions made **before the tournament starts**. Each is worth **10 points**.

| Bonus Type | Description | Example |
|------------|-------------|---------|
| Champion | Who wins the tournament | Argentina |
| Top Scorer | Tournament's leading goal scorer | Mbappe |
| MVP | Tournament's best player | Messi |
| Revelation | Surprise team/player of the tournament | Japan |

- Bonus predictions **lock when the first match of the tournament kicks off**
- Bonus types are configurable per tournament via `TournamentBonusType`
- Resolution (correct/incorrect) is determined at tournament end

## Prediction Rules

1. **Deadline**: Predictions lock at match kickoff time (server-side validation using `scheduledAt`)
2. **Hidden until kickoff**: Other users' predictions for a match are NOT visible until the match starts
3. **Editable**: Users can change their prediction any number of times before kickoff
4. **Per group**: Same user can have different predictions for the same match in different groups

## Leaderboard

### Ranking Calculation

Total points = Sum of all match prediction points + Sum of correct bonus prediction points

### Tiebreaker Rules

When users have the same total points:

1. **Most exact score predictions** (higher is better)
2. **Shared position** (if still tied, users share the same rank)

### Scope

- Leaderboard is **per group per tournament**
- A user's rank in Group A may differ from their rank in Group B (different predictions)
- Cached in Redis for performance, recalculated when match results are updated
