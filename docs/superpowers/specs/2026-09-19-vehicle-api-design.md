# Global Vehicle API Design Spec

**Date**: 2026-09-19  
**Status**: Approved  
**Author**: Antigravity Assistant & User  

---

## 1. Overview & Goals

The **Global Vehicle API** (`Vehicle2API`) provides comprehensive, up-to-date data on car manufacturers, models, and trim variants currently on sale across countries worldwide.

### Key Features
- **Hierarchical Navigation**: Filter by Country $\rightarrow$ Manufacturer $\rightarrow$ Model $\rightarrow$ Trim Variant.
- **Global Country Coverage**: Supports major markets in North America, Europe, Asia-Pacific, Latin America, and the Middle East.
- **Rich Trim Specs**: Detailed specifications per trim (Engine, Power HP, Transmission, Drivetrain, Fuel Type, Price, On-Sale status).
- **Fast RESTful API**: Built with Node.js and SQLite for lightweight, high-performance querying with zero external database dependencies.
- **Live Extension Proxy**: Includes an integrated bridge for dynamic NHTSA vPIC vehicle decoding.

---

## 2. Architecture & Data Flow

```
[ Client / Web / App ]
         │
         ▼
[ Express REST Router ] ── ( /health, /countries, /manufacturers, /models, /trims, /search )
         │
         ├───▶ [ SQLite Database Engine (local file) ]
         │       ├── countries
         │       ├── manufacturers
         │       ├── models
         │       └── trims
         │
         └───▶ [ Dynamic Proxy Service (NHTSA vPIC Bridge) ]
```

---

## 3. Database Schema (SQLite)

```sql
CREATE TABLE IF NOT EXISTS countries (
    code TEXT PRIMARY KEY, -- ISO 3166-1 alpha-2 (e.g., 'US', 'IN', 'DE', 'JP')
    name TEXT NOT NULL,
    region TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id TEXT PRIMARY KEY, -- Slug, e.g., 'toyota', 'bmw', 'tata'
    name TEXT NOT NULL,
    country_origin TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY, -- Slug, e.g., 'toyota-corolla', 'tata-nexon'
    manufacturer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    body_type TEXT NOT NULL, -- 'Sedan', 'SUV', 'Hatchback', 'EV', 'Coupe', 'Truck'
    FOREIGN KEY(manufacturer_id) REFERENCES manufacturers(id)
);

CREATE TABLE IF NOT EXISTS trims (
    id TEXT PRIMARY KEY, -- Unique ID, e.g., 'toyota-corolla-us-2026-le'
    model_id TEXT NOT NULL,
    country_code TEXT NOT NULL,
    trim_name TEXT NOT NULL, -- e.g., 'LE', 'XSE', 'Long Range AWD', 'Fearless+ S'
    year INTEGER NOT NULL,
    engine TEXT,
    transmission TEXT,
    drivetrain TEXT, -- 'FWD', 'RWD', 'AWD', '4WD'
    fuel_type TEXT, -- 'Gasoline', 'Diesel', 'EV', 'Hybrid', 'PHEV'
    power_hp INTEGER,
    price_local TEXT,
    on_sale INTEGER DEFAULT 1, -- 1 for true, 0 for false
    FOREIGN KEY(model_id) REFERENCES models(id),
    FOREIGN KEY(country_code) REFERENCES countries(code)
);
```

> **Ponytail Note**:  
> `// ponytail: SQLite single-file DB -> Upgrade to PostgreSQL/MySQL if concurrent writes > 10,000 req/sec.`

---

## 4. API Specification

### `GET /api/v1/countries`
Returns list of supported countries and regions.

### `GET /api/v1/manufacturers`
- **Query Params**: `country` (optional, e.g., `IN`, `US`)
- **Returns**: Array of manufacturers active in specified region or globally.

### `GET /api/v1/models`
- **Query Params**: `manufacturer` (required/optional), `country` (optional), `body_type` (optional)
- **Returns**: Models matching criteria.

### `GET /api/v1/trims`
- **Query Params**: `model` (required), `country` (optional), `year` (optional), `on_sale` (optional)
- **Returns**: Array of trim variants with complete specifications.

### `GET /api/v1/search`
- **Query Params**: `q` (search string), `country` (optional)
- **Returns**: Combined matching manufacturers, models, and trims.

### `GET /api/v1/nhtsa/decode/:vin`
- Dynamic VIN decoder proxy to NHTSA vPIC API.

---

## 5. Seed Data Strategy & Regional Coverage

The initial seeded database covers key models across major countries:
- **US / Americas**: Tesla (Model 3/Y/S/X trims), Ford (F-150, Mustang Mach-E), Chevrolet, Toyota (Camry, Corolla, RAV4).
- **India**: Tata Motors (Nexon, Punch, Harrier trims), Maruti Suzuki (Swift, Baleno, Brezza), Mahindra (XUV700, Thar), Hyundai India.
- **Europe (Germany/UK)**: BMW (3 Series, i4), Mercedes-Benz (C-Class, EQE), Volkswagen (Golf, ID.4), Audi.
- **Asia-Pacific (Japan/China)**: Toyota, Honda, Nissan, BYD (Seal, Atto 3, Dolphin trims), Geely.

---

## 6. Testing & Verification

- Express server unit tests using Native Node.js test runner (`node --test`).
- Endpoint integration testing for JSON payload structures and query filtering.
