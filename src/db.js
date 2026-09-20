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
            country_origin TEXT NOT NULL,
            official_website TEXT,
            active_in_india INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS models (
            id TEXT PRIMARY KEY,
            manufacturer_id TEXT NOT NULL,
            name TEXT NOT NULL,
            body_type TEXT NOT NULL,
            segment TEXT,
            introduced_year INTEGER,
            status TEXT DEFAULT 'ACTIVE',
            FOREIGN KEY(manufacturer_id) REFERENCES manufacturers(id)
        );

        CREATE TABLE IF NOT EXISTS generations (
            id TEXT PRIMARY KEY,
            model_id TEXT NOT NULL,
            generation_number INTEGER,
            name TEXT NOT NULL,
            start_year INTEGER,
            end_year INTEGER,
            FOREIGN KEY(model_id) REFERENCES models(id)
        );

        CREATE TABLE IF NOT EXISTS facelifts (
            id TEXT PRIMARY KEY,
            generation_id TEXT NOT NULL,
            name TEXT NOT NULL,
            release_year INTEGER NOT NULL,
            FOREIGN KEY(generation_id) REFERENCES generations(id)
        );

        CREATE TABLE IF NOT EXISTS model_years (
            id TEXT PRIMARY KEY,
            generation_id TEXT NOT NULL,
            facelift_id TEXT,
            year INTEGER NOT NULL,
            FOREIGN KEY(generation_id) REFERENCES generations(id),
            FOREIGN KEY(facelift_id) REFERENCES facelifts(id)
        );

        CREATE TABLE IF NOT EXISTS engines (
            id TEXT PRIMARY KEY,
            name TEXT,
            engine_code TEXT,
            displacement_cc INTEGER,
            cylinders INTEGER,
            configuration TEXT,
            aspiration TEXT,
            fuel_type TEXT NOT NULL,
            secondary_fuel TEXT,
            max_power_ps REAL,
            power_rpm INTEGER,
            max_torque_nm REAL,
            torque_rpm INTEGER,
            valvetrain TEXT,
            emission_standard TEXT,
            battery_capacity_kwh REAL,
            motor_power_ps REAL,
            motor_torque_nm REAL,
            ev_range_km INTEGER
        );

        CREATE TABLE IF NOT EXISTS transmissions (
            id TEXT PRIMARY KEY,
            transmission_type TEXT NOT NULL,
            gear_count INTEGER,
            drive_type TEXT NOT NULL DEFAULT 'FWD'
        );

        CREATE TABLE IF NOT EXISTS powertrains (
            id TEXT PRIMARY KEY,
            engine_id TEXT NOT NULL,
            transmission_id TEXT NOT NULL,
            fuel_type TEXT NOT NULL,
            secondary_fuel TEXT,
            FOREIGN KEY(engine_id) REFERENCES engines(id),
            FOREIGN KEY(transmission_id) REFERENCES transmissions(id)
        );

        CREATE TABLE IF NOT EXISTS variants (
            id TEXT PRIMARY KEY,
            model_id TEXT NOT NULL,
            generation_id TEXT,
            facelift_id TEXT,
            model_year_id TEXT,
            powertrain_id TEXT,
            country_code TEXT NOT NULL DEFAULT 'IN',
            raw_variant_name TEXT NOT NULL,
            canonical_variant_name TEXT NOT NULL,
            manufacturer_variant_name TEXT NOT NULL,
            year INTEGER NOT NULL,
            body_type TEXT,
            seating_capacity INTEGER,
            doors INTEGER,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            available_from TEXT,
            available_until TEXT,
            completeness_score REAL DEFAULT 0.0,
            confidence_score REAL DEFAULT 0.0,
            FOREIGN KEY(model_id) REFERENCES models(id),
            FOREIGN KEY(generation_id) REFERENCES generations(id),
            FOREIGN KEY(facelift_id) REFERENCES facelifts(id),
            FOREIGN KEY(model_year_id) REFERENCES model_years(id),
            FOREIGN KEY(powertrain_id) REFERENCES powertrains(id),
            FOREIGN KEY(country_code) REFERENCES countries(code)
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

        CREATE TABLE IF NOT EXISTS specifications (
            id TEXT PRIMARY KEY,
            variant_id TEXT NOT NULL,
            category TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            numeric_value REAL,
            unit TEXT,
            confidence_state TEXT DEFAULT 'VERIFIED',
            FOREIGN KEY(variant_id) REFERENCES variants(id)
        );

        CREATE TABLE IF NOT EXISTS variant_features (
            id TEXT PRIMARY KEY,
            variant_id TEXT NOT NULL,
            category TEXT NOT NULL,
            feature_key TEXT NOT NULL,
            feature_name TEXT NOT NULL,
            is_standard INTEGER NOT NULL DEFAULT 1,
            confidence_state TEXT DEFAULT 'VERIFIED',
            FOREIGN KEY(variant_id) REFERENCES variants(id)
        );

        CREATE TABLE IF NOT EXISTS prices (
            id TEXT PRIMARY KEY,
            variant_id TEXT NOT NULL,
            ex_showroom_price REAL NOT NULL,
            on_road_price REAL,
            market TEXT NOT NULL DEFAULT 'IN',
            city TEXT,
            currency TEXT NOT NULL DEFAULT 'INR',
            valid_from TEXT,
            valid_until TEXT,
            source_name TEXT,
            retrieved_at TEXT,
            FOREIGN KEY(variant_id) REFERENCES variants(id)
        );

        CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT,
            source_type TEXT NOT NULL,
            publisher TEXT,
            market TEXT DEFAULT 'IN',
            retrieved_at TEXT,
            publication_date TEXT
        );

        CREATE TABLE IF NOT EXISTS source_observations (
            id TEXT PRIMARY KEY,
            variant_id TEXT NOT NULL,
            field_name TEXT NOT NULL,
            raw_value TEXT,
            normalized_value TEXT,
            source_id TEXT NOT NULL,
            confidence REAL NOT NULL,
            retrieved_at TEXT NOT NULL,
            FOREIGN KEY(variant_id) REFERENCES variants(id),
            FOREIGN KEY(source_id) REFERENCES sources(id)
        );

        CREATE TABLE IF NOT EXISTS conflicts (
            id TEXT PRIMARY KEY,
            variant_id TEXT NOT NULL,
            field_name TEXT NOT NULL,
            competing_values TEXT NOT NULL,
            preferred_value TEXT,
            resolution_reason TEXT,
            status TEXT NOT NULL DEFAULT 'UNRESOLVED',
            resolved_at TEXT,
            resolved_by TEXT,
            FOREIGN KEY(variant_id) REFERENCES variants(id)
        );

        CREATE TABLE IF NOT EXISTS raw_source_data (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            manufacturer_id TEXT,
            model_id TEXT,
            file_path TEXT,
            content_hash TEXT,
            retrieved_at TEXT NOT NULL,
            FOREIGN KEY(source_id) REFERENCES sources(id)
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            details TEXT,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_variants_lookup ON variants(model_id, country_code, year);
        CREATE INDEX IF NOT EXISTS idx_trims_lookup ON trims(model_id, country_code, year);
        CREATE INDEX IF NOT EXISTS idx_models_mfr ON models(manufacturer_id, body_type);
        CREATE INDEX IF NOT EXISTS idx_specs_variant ON specifications(variant_id, category);
        CREATE INDEX IF NOT EXISTS idx_features_variant ON variant_features(variant_id, category);
        CREATE INDEX IF NOT EXISTS idx_prices_variant ON prices(variant_id);
        CREATE INDEX IF NOT EXISTS idx_obs_variant ON source_observations(variant_id, field_name);
        CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);

        CREATE VIRTUAL TABLE IF NOT EXISTS vehicle_fts USING fts5(
            trim_id UNINDEXED,
            manufacturer,
            model,
            trim_name,
            country
        );
    `);

    // Dynamic ALTER TABLE migrations for pre-existing SQLite database files
    const mfrCols = db.pragma('table_info(manufacturers)').map(c => c.name);
    if (!mfrCols.includes('official_website')) {
        db.exec('ALTER TABLE manufacturers ADD COLUMN official_website TEXT');
    }
    if (!mfrCols.includes('active_in_india')) {
        db.exec('ALTER TABLE manufacturers ADD COLUMN active_in_india INTEGER DEFAULT 1');
    }

    const modelCols = db.pragma('table_info(models)').map(c => c.name);
    if (!modelCols.includes('segment')) {
        db.exec('ALTER TABLE models ADD COLUMN segment TEXT');
    }
    if (!modelCols.includes('introduced_year')) {
        db.exec('ALTER TABLE models ADD COLUMN introduced_year INTEGER');
    }
    if (!modelCols.includes('status')) {
        db.exec("ALTER TABLE models ADD COLUMN status TEXT DEFAULT 'ACTIVE'");
    }

    return db;
}
