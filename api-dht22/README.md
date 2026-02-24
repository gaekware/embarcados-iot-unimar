# api-dht22 — ESP32 Sensor API

REST API (Node.js + TypeScript + Prisma + PostgreSQL) to receive and store soil moisture data sent by an ESP32 module over ngrok.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 |
| Web framework | Express 5 |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Tunnel | ngrok |

---

## Project Structure (MVC)

```
api-dht22/
├── prisma/
│   └── schema.prisma        ← Database schema
├── src/
│   ├── controllers/
│   │   └── sensorController.ts  ← HTTP request/response logic
│   ├── services/
│   │   └── sensorService.ts     ← Business logic + Prisma queries
│   ├── routes/
│   │   └── sensorRoutes.ts      ← Route definitions
│   ├── middlewares/
│   │   └── errorHandler.ts      ← Global error middleware
│   ├── prisma.ts                ← Prisma client singleton
│   ├── app.ts                   ← Express app config
│   └── server.ts                ← Entry point
├── .env.example
├── tsconfig.json
└── package.json
```

---

## Setup

### 1. Clone & install dependencies
```bash
cd api-dht22
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Edit .env and set DATABASE_URL to your PostgreSQL connection string
```

Example `DATABASE_URL`:
```
postgresql://postgres:secret@localhost:5432/esp32_db?schema=public
```

### 3. Run Prisma migration
```bash
npx prisma migrate dev --name init
```

### 4. Start the development server
```bash
npm run dev
```

The server starts on `http://localhost:3000` by default.

---

## API Endpoints

### `POST /api/sensors`
Create a new sensor reading (called by the ESP32).

**Request body:**
```json
{
  "deviceId": "esp32-001",
  "timestamp": "2026-02-24T20:00:00Z",
  "soilMoistureRaw": 1500,
  "soilMoisturePercent": 65.3
}
```

**Response `201`:**
```json
{
  "id": 1,
  "deviceId": "esp32-001",
  "timestamp": "2026-02-24T20:00:00.000Z",
  "soilMoistureRaw": 1500,
  "soilMoisturePercent": 65.3,
  "createdAt": "2026-02-24T20:00:01.000Z"
}
```

---

### `GET /api/sensors`
Retrieve all sensor readings (paginated).

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `deviceId` | string | Filter by device ID |
| `limit` | number | Max results (default: 50) |
| `offset` | number | Skip N results (default: 0) |

**Response `200`:**
```json
{
  "total": 42,
  "readings": [ ... ]
}
```

---

### `GET /api/sensors/:id`
Retrieve a single reading by its numeric ID.

---

### `GET /health`
Simple health check — returns `{ "status": "ok" }`.

---

## Connecting the ESP32

On your ESP32 firmware, POST to the ngrok URL:

```cpp
// Arduino / ESP32 example snippet
const char* serverUrl = "https://YOUR_NGROK_URL/api/sensors";

// In your HTTP POST:
String payload = "{";
payload += "\"deviceId\":\"esp32-001\",";
payload += "\"timestamp\":\"" + isoTimestamp + "\",";
payload += "\"soilMoistureRaw\":" + String(rawValue) + ",";
payload += "\"soilMoisturePercent\":" + String(percent);
payload += "}";
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with ts-node (development) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled JS |
| `npm run typecheck` | Type-check without emitting |
