# Pichichi - External Data Integration

## API-Football (api-football.com)

API-Football is the external data provider for tournament fixtures, match results, team data, and player statistics.

### Why API-Football

- ALL endpoints available on ALL plans (including free)
- 1,236+ leagues and cups worldwide
- 15-second live score updates
- Bulk fixture fetch (up to 20 matches in 1 API call)
- Full player stats (top scorers, assists, ratings)
- Team logos are FREE (don't count toward request quota)

### Plans and Pricing

| Plan | Price | Requests/Day | When to Use |
|------|-------|-------------|-------------|
| Free | $0 | 100 | Development, testing, between tournaments |
| Pro | $19/mo | 7,500 | Active tournaments |
| Ultra | $29/mo | 75,000 | Peak periods (World Cup) |

**Strategy**: Free during development, upgrade to Pro during active tournaments, downgrade between tournaments.

### Authentication

```
Header: x-apisports-key: YOUR_API_KEY
Base URL: https://v3.football.api-sports.io/
Method: GET only
```

> IMPORTANT: Do NOT add extra headers (like Content-Type). The API firewall blocks requests with unexpected headers.

### Key Endpoints

#### Fixtures (Matches)

```
GET /fixtures?league={id}&season={year}     # All matches for a tournament
GET /fixtures?id={id1}-{id2}-{id3}          # Bulk fetch (up to 20 matches)
GET /fixtures?live=all                       # All live matches right now
GET /fixtures?date={YYYY-MM-DD}              # Matches by date
```

Response includes: fixture ID, status, date, venue, teams (with logos), scores (halftime, fulltime, extra time, penalties), league round.

#### Standings

```
GET /standings?league={id}&season={year}     # Group tables / league rankings
```

#### Teams

```
GET /teams?league={id}&season={year}         # All teams in a competition
```

Response includes: ID, name, code, country, logo URL, is national team.

#### Players

```
GET /players/topscorers?league={id}&season={year}  # Top 20 scorers
GET /players/topassists?league={id}&season={year}  # Top 20 assisters
```

### Match Statuses

These statuses map to our internal `MatchStatus` enum:

| API-Football Status | Meaning | Our Status |
|---|---|---|
| `TBD`, `NS` | Not started | `SCHEDULED` |
| `1H`, `HT`, `2H`, `ET`, `BT`, `P` | In play | `LIVE` |
| `FT`, `AET`, `PEN` | Finished | `FINISHED` |
| `PST` | Postponed | `POSTPONED` |
| `CANC`, `ABD`, `AWD`, `WO` | Cancelled/Abandoned | `CANCELLED` |
| `SUSP`, `INT` | Interrupted | `LIVE` (or special handling) |

### Known Competition IDs

> To be verified after registration.

| Competition | Likely ID |
|-------------|-----------|
| FIFA World Cup | 1 |
| Copa America | 9 |
| Champions League | 2 |
| Europa League | 3 |

## Smart Cron Architecture

Instead of polling the API constantly (wasting requests), we use an intelligent cron job that only calls the API when necessary.

### Flow

```
Every 5 minutes:
  1. Query OUR DB: Any matches TODAY with status != FINISHED?
     → No → SKIP (don't call API, save quota)

  2. Any matches currently IN PLAY or recently ended (within 30 min)?
     → No → SKIP

  3. Fetch results for those matches:
     GET /fixtures?id={id1}-{id2}-{id3}   (bulk, 1 call for up to 20 matches)

  4. For each match with updated data:
     a. Update match result in our DB
     b. If status changed to FINISHED:
        - Calculate points for ALL predictions on this match
        - Update leaderboard rankings
        - Send push notifications (via FCM)
     c. If status changed to LIVE:
        - Lock predictions for this match
        - Reveal other users' predictions

  5. All matches today FINISHED?
     → Yes → Stop polling until tomorrow
```

### Estimated API Usage

| Scenario | Naive (24h polling) | Smart Cron |
|----------|-------------------|------------|
| Day with 4 matches (~6h window) | 288 calls | ~72 calls |
| Day with no matches | 288 calls | 0 calls |
| Full World Cup (64 matches, 32 days) | ~9,200 calls | ~2,300 calls |

The smart cron saves ~75% of API requests, keeping us well within free tier limits on quiet days and Pro tier during peak days.

### Edge Cases

| Scenario | Handling |
|----------|----------|
| Match postponed (PST) | Mark as POSTPONED, stop polling |
| Match abandoned (ABD) | Mark as CANCELLED, don't calculate points |
| Extra time (AET) | Use 90min+ET score for points, record ET flag |
| Penalty shootout (PEN) | Use 90min+ET score for points, record penalty scores separately |
| API downtime | Cache last known state, show "data may be delayed" |

## Data Sync Strategy

### Before Tournament (one-time seed)

1. Fetch all fixtures: `GET /fixtures?league=1&season=2026`
2. Fetch all teams: `GET /teams?league=1&season=2026`
3. Store in our DB with API-Football IDs for future reference
4. Set up tournament phases and multipliers
5. Create bonus types (champion, top scorer, etc.)

### During Tournament (cron job)

- Smart cron runs every 5 minutes (see flow above)
- Standings updated after each match day
- Top scorers checked daily (for bonus prediction resolution)

### After Tournament

- Final bonus prediction resolution (champion, top scorer, MVP, revelation)
- Archive tournament data
- Downgrade API plan to free tier
