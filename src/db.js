import Database from 'better-sqlite3';

// ponytail: SQLite single-file DB -> Upgrade to PostgreSQL/MySQL if concurrent writes > 10,000 req/sec.

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

        CREATE INDEX IF NOT EXISTS idx_trims_lookup ON trims(model_id, country_code, year);
        CREATE INDEX IF NOT EXISTS idx_models_mfr ON models(manufacturer_id, body_type);
        CREATE INDEX IF NOT EXISTS idx_trims_country ON trims(country_code);

        CREATE VIRTUAL TABLE IF NOT EXISTS vehicle_fts USING fts5(
            trim_id UNINDEXED,
            manufacturer,
            model,
            trim_name,
            country
        );
    `);

    return db;
}

