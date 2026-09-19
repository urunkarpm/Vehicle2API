# Global Vehicle API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-dependency, ultra-fast Node.js REST API backed by SQLite that provides detailed global car manufacturer, model, and trim variant specifications across countries.

**Architecture:** A lightweight Express application using SQLite (`better-sqlite3` or `sqlite3`) for local file storage, with clean RESTful endpoints, seeded global vehicle datasets, and a dynamic NHTSA vPIC VIN decoder bridge.

**Tech Stack:** Node.js (v24), Express, `better-sqlite3`, Node.js native test runner (`node --test`).

**Spec:** [docs/superpowers/specs/2026-09-19-vehicle-api-design.md](file:///C:/Users/uprasenjeet/Documents/Vehicle2API/docs/superpowers/specs/2026-09-19-vehicle-api-design.md)

## Global Constraints

- Node.js native modules and clean ES modules (`"type": "module"`).
- Zero complex ORM overhead; pure parameterized SQL queries for security and performance.
- // ponytail: SQLite single-file DB -> Upgrade to PostgreSQL/MySQL if concurrent writes > 10,000 req/sec.

---

### Task 1: Package Scaffolding & Database Connection

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `src/db.js`
- Test: `test/db.test.js`

**Interfaces:**
- Consumes: `better-sqlite3` package
- Produces: `initDb(dbPath)`: returns SQLite database instance with tables (`countries`, `manufacturers`, `models`, `trims`) initialized.

- [ ] **Step 1: Write the failing test**

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { initDb } from '../src/db.js';

test('initDb creates required tables and schema', () => {
    const db = initDb(':memory:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    assert.ok(tables.includes('countries'));
    assert.ok(tables.includes('manufacturers'));
    assert.ok(tables.includes('models'));
    assert.ok(tables.includes('trims'));
    db.close();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/db.test.js`  
Expected: FAIL (Cannot find module or `initDb` not implemented)

- [ ] **Step 3: Implement package.json and db.js**

```json
{
  "name": "vehicle2api",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "test": "node --test test/*.test.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "better-sqlite3": "^11.3.0"
  }
}
```

```javascript
// src/db.js
import Database from 'better-sqlite3';

export function initDb(dbPath = 'vehicle2api.db') {
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');

    db.exec(`
        CREATE TABLE IF NOT EXISTS countries (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            region TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS manufacturers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            country_origin TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY,
            manufacturer_id TEXT NOT NULL,
            name TEXT NOT NULL,
            body_type TEXT NOT NULL,
            FOREIGN KEY(manufacturer_id) REFERENCES manufacturers(id)
        );

        CREATE TABLE IF NOT EXISTS trims (
            id TEXT PRIMARY KEY,
            model_id TEXT NOT NULL,
            country_code TEXT NOT NULL,
            trim_name TEXT NOT NULL,
            year INTEGER NOT NULL,
            engine TEXT,
            transmission TEXT,
            drivetrain TEXT,
            fuel_type TEXT,
            power_hp INTEGER,
            price_local TEXT,
            on_sale INTEGER DEFAULT 1,
            FOREIGN KEY(model_id) REFERENCES models(id),
            FOREIGN KEY(country_code) REFERENCES countries(code)
        );
    `);

    return db;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install && node --test test/db.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore src/db.js test/db.test.js
git commit -m "feat: scaffold package and sqlite schema"
```

---

### Task 2: Data Access Layer & Global Data Seeding

**Files:**
- Create: `src/seedData.js`
- Create: `src/models.js`
- Test: `test/models.test.js`

**Interfaces:**
- Consumes: `src/db.js`
- Produces: 
  - `seedDatabase(db)`
  - `getCountries(db)`
  - `getManufacturers(db, countryCode)`
  - `getModels(db, { manufacturerId, countryCode, bodyType })`
  - `getTrims(db, { modelId, countryCode, year, onSale })`
  - `searchVehicles(db, query, countryCode)`

- [ ] **Step 1: Write failing data layer tests**

```javascript
// test/models.test.js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { initDb } from '../src/db.js';
import { seedDatabase, getCountries, getManufacturers, getModels, getTrims, searchVehicles } from '../src/models.js';

let db;
beforeEach(() => {
    db = initDb(':memory:');
    seedDatabase(db);
});

test('getCountries returns global seeded countries', () => {
    const countries = getCountries(db);
    assert.ok(countries.length >= 5);
    const us = countries.find(c => c.code === 'US');
    assert.strictEqual(us.name, 'United States');
});

test('getTrims filters trims by model and country', () => {
    const trims = getTrims(db, { modelId: 'toyota-corolla', countryCode: 'US' });
    assert.ok(trims.length > 0);
    assert.strictEqual(trims[0].trim_name, 'LE');
});

test('searchVehicles returns matching items', () => {
    const results = searchVehicles(db, 'Nexon');
    assert.ok(results.trims.length > 0 || results.models.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/models.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement seed data & data access functions in src/models.js**

Implement `src/seedData.js` with rich records across US, India, UK, Germany, Japan, China, Australia, UAE, Brazil, and export access functions in `src/models.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/models.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/seedData.js src/models.js test/models.test.js
git commit -m "feat: implement data seeding and access methods"
```

---

### Task 3: Express REST API Server & Endpoints

**Files:**
- Create: `src/app.js`
- Create: `src/server.js`
- Test: `test/api.test.js`

**Interfaces:**
- Consumes: `src/db.js`, `src/models.js`
- Produces: Express Application with endpoints `/api/v1/countries`, `/api/v1/manufacturers`, `/api/v1/models`, `/api/v1/trims`, `/api/v1/search`, `/health`.

- [ ] **Step 1: Write failing API endpoint tests**

```javascript
// test/api.test.js
import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db.js';
import { seedDatabase } from '../src/models.js';

let server;
let baseUrl;

before(async () => {
    const db = initDb(':memory:');
    seedDatabase(db);
    const app = createApp(db);
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
});

after(() => {
    server.close();
});

test('GET /health returns OK and metric counts', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'OK');
    assert.ok(body.metrics.total_trims > 0);
});

test('GET /api/v1/trims returns trims array', async () => {
    const res = await fetch(`${baseUrl}/api/v1/trims?model=toyota-corolla&country=US`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.trims));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/api.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement Express app in src/app.js and server launcher in src/server.js**

Implement clean handlers for all endpoints, query parameters, error responses (400, 404, 500).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/api.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app.js src/server.js test/api.test.js
git commit -m "feat: implement Express REST API routes and health endpoints"
```

---

### Task 4: Dynamic NHTSA VIN Decoder Proxy Bridge

**Files:**
- Create: `src/nhtsaProxy.js`
- Modify: `src/app.js`
- Test: `test/nhtsaProxy.test.js`

**Interfaces:**
- Consumes: NHTSA vPIC Public REST API (`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/`)
- Produces: `decodeVin(vin)` helper function and endpoint `GET /api/v1/nhtsa/decode/:vin`.

- [ ] **Step 1: Write failing test for NHTSA VIN bridge**

```javascript
// test/nhtsaProxy.test.js
import { test } from 'node:test';
import assert from 'node:assert';
import { normalizeNhtsaResponse } from '../src/nhtsaProxy.js';

test('normalizeNhtsaResponse formats NHTSA API output', () => {
    const rawNhtsa = {
        Results: [
            { Variable: 'Make', Value: 'TOYOTA' },
            { Variable: 'Model', Value: 'Corolla' },
            { Variable: 'Model Year', Value: '2024' },
            { Variable: 'Trim', Value: 'LE' },
            { Variable: 'Plant Country', Value: 'UNITED STATES (USA)' }
        ]
    };

    const normalized = normalizeNhtsaResponse(rawNhtsa);
    assert.strictEqual(normalized.manufacturer, 'TOYOTA');
    assert.strictEqual(normalized.model, 'Corolla');
    assert.strictEqual(normalized.year, '2024');
    assert.strictEqual(normalized.trim, 'LE');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/nhtsaProxy.test.js`  
Expected: FAIL

- [ ] **Step 3: Implement src/nhtsaProxy.js and integrate route into src/app.js**

Implement `decodeVin` using standard `fetch` with error handling, timeout, and response normalization.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/nhtsaProxy.test.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/nhtsaProxy.js src/app.js test/nhtsaProxy.test.js
git commit -m "feat: add dynamic NHTSA VIN decoder proxy bridge"
```
