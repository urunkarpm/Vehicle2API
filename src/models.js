import { countries, manufacturers, models, trims } from './seedData.js';
import { runIngestionPipeline } from './pipeline/ingestionEngine.js';

// ponytail: Modular database repository -> Upgrade to ORM (Prisma / Drizzle) if schema migrations > 50 files.

export function seedDatabase(db) {
    const insertCountry = db.prepare(`
        INSERT OR IGNORE INTO countries (code, name, region)
        VALUES (@code, @name, @region)
    `);
    const insertManufacturer = db.prepare(`
        INSERT OR IGNORE INTO manufacturers (id, name, country_origin)
        VALUES (@id, @name, @country_origin)
    `);
    const insertModel = db.prepare(`
        INSERT OR IGNORE INTO models (id, manufacturer_id, name, body_type)
        VALUES (@id, @manufacturer_id, @name, @body_type)
    `);
    const insertTrim = db.prepare(`
        INSERT OR IGNORE INTO trims (
            id, model_id, country_code, trim_name, year,
            engine, transmission, drivetrain, fuel_type,
            power_hp, price_local, on_sale
        ) VALUES (
            @id, @model_id, @country_code, @trim_name, @year,
            @engine, @transmission, @drivetrain, @fuel_type,
            @power_hp, @price_local, @on_sale
        )
    `);
    const insertFts = db.prepare(`
        INSERT OR IGNORE INTO vehicle_fts (trim_id, manufacturer, model, trim_name, country)
        VALUES (@trim_id, @manufacturer, @model, @trim_name, @country)
    `);

    const seedTransaction = db.transaction(() => {
        for (const country of countries) {
            insertCountry.run(country);
        }
        for (const mfr of manufacturers) {
            insertManufacturer.run(mfr);
        }
        for (const model of models) {
            insertModel.run(model);
        }
        for (const trim of trims) {
            insertTrim.run({
                on_sale: 1,
                ...trim
            });
            const mfr = manufacturers.find(m => m.id === (models.find(mo => mo.id === trim.model_id)?.manufacturer_id));
            const modelObj = models.find(mo => mo.id === trim.model_id);
            insertFts.run({
                trim_id: trim.id,
                manufacturer: mfr ? mfr.name : '',
                model: modelObj ? modelObj.name : '',
                trim_name: trim.trim_name,
                country: trim.country_code
            });
        }
    });

    seedTransaction();

    // Ingest India hierarchical pipeline data
    runIngestionPipeline(db);
}

export function getCountries(db) {
    return db.prepare('SELECT code, name, region FROM countries ORDER BY name ASC').all();
}

export function getManufacturers(db, countryCode) {
    if (countryCode && typeof countryCode === 'string' && countryCode.trim() !== '') {
        const normalized = countryCode.trim().toUpperCase();
        return db.prepare(`
            SELECT DISTINCT m.id, m.name, m.country_origin, m.official_website, m.active_in_india
            FROM manufacturers m
            WHERE UPPER(m.country_origin) = ?
               OR EXISTS (
                   SELECT 1 FROM models mo
                   JOIN trims t ON t.model_id = mo.id
                   WHERE mo.manufacturer_id = m.id AND UPPER(t.country_code) = ?
               )
               OR EXISTS (
                   SELECT 1 FROM models mo
                   JOIN variants v ON v.model_id = mo.id
                   WHERE mo.manufacturer_id = m.id AND UPPER(v.country_code) = ?
               )
            ORDER BY m.name ASC
        `).all(normalized, normalized, normalized);
    }
    return db.prepare('SELECT id, name, country_origin, official_website, active_in_india FROM manufacturers ORDER BY name ASC').all();
}

export function getModels(db, { manufacturerId, countryCode, bodyType, limit = 100, page = 1 } = {}) {
    const conditions = [];
    const params = [];

    if (manufacturerId && typeof manufacturerId === 'string' && manufacturerId.trim() !== '') {
        conditions.push('LOWER(m.manufacturer_id) = LOWER(?)');
        params.push(manufacturerId.trim());
    }
    if (bodyType && typeof bodyType === 'string' && bodyType.trim() !== '') {
        conditions.push('LOWER(m.body_type) = LOWER(?)');
        params.push(bodyType.trim());
    }
    if (countryCode && typeof countryCode === 'string' && countryCode.trim() !== '') {
        conditions.push(`
            (EXISTS (
                SELECT 1 FROM trims t
                WHERE t.model_id = m.id AND UPPER(t.country_code) = UPPER(?)
            ) OR EXISTS (
                SELECT 1 FROM variants v
                WHERE v.model_id = m.id AND UPPER(v.country_code) = UPPER(?)
            ))
        `);
        params.push(countryCode.trim(), countryCode.trim());
    }

    let query = `
        SELECT DISTINCT m.id, m.manufacturer_id, m.name, m.body_type, m.segment, m.introduced_year, m.status
        FROM models m
    `;
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY m.name ASC';

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const parsedPage = Math.max(1, Number(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    query += ' LIMIT ? OFFSET ?';
    params.push(parsedLimit, offset);

    return db.prepare(query).all(...params);
}

export function getGenerations(db, modelId) {
    return db.prepare('SELECT * FROM generations WHERE LOWER(model_id) = LOWER(?) ORDER BY start_year DESC').all(modelId);
}

export function getFacelifts(db, generationId) {
    return db.prepare('SELECT * FROM facelifts WHERE generation_id = ? ORDER BY release_year DESC').all(generationId);
}

export function getTrims(db, { modelId, countryCode, year, onSale, limit = 100, page = 1 } = {}) {
    const conditions = [];
    const params = [];

    if (modelId && typeof modelId === 'string' && modelId.trim() !== '') {
        conditions.push('LOWER(t.model_id) = LOWER(?)');
        params.push(modelId.trim());
    }
    if (countryCode && typeof countryCode === 'string' && countryCode.trim() !== '') {
        conditions.push('UPPER(t.country_code) = UPPER(?)');
        params.push(countryCode.trim());
    }
    if (year !== undefined && year !== null && year !== '') {
        conditions.push('t.year = ?');
        params.push(Number(year));
    }
    if (onSale !== undefined && onSale !== null && onSale !== '') {
        conditions.push('t.on_sale = ?');
        const boolVal = (onSale === true || onSale === 1 || onSale === '1' || onSale === 'true') ? 1 : 0;
        params.push(boolVal);
    }

    let query = `
        SELECT t.*
        FROM trims t
    `;
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY t.year DESC, t.trim_name ASC, t.id ASC';

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    const parsedPage = Math.max(1, Number(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    query += ' LIMIT ? OFFSET ?';
    params.push(parsedLimit, offset);

    return db.prepare(query).all(...params);
}

export function getVehicleById(db, id) {
    const variant = db.prepare(`
        SELECT v.*, m.name AS model_name, mfr.name AS manufacturer_name
        FROM variants v
        JOIN models m ON v.model_id = m.id
        JOIN manufacturers mfr ON m.manufacturer_id = mfr.id
        WHERE v.id = ?
    `).get(id);

    if (!variant) return null;

    const specs = db.prepare('SELECT category, key, value, numeric_value, unit, confidence_state FROM specifications WHERE variant_id = ?').all(id);
    const features = db.prepare('SELECT category, feature_key, feature_name, is_standard, confidence_state FROM variant_features WHERE variant_id = ?').all(id);
    const prices = db.prepare('SELECT ex_showroom_price, on_road_price, market, city, currency, valid_from, valid_until, source_name FROM prices WHERE variant_id = ?').all(id);
    const observations = db.prepare(`
        SELECT obs.field_name, obs.raw_value, obs.normalized_value, obs.confidence, s.name AS source_name, s.source_type
        FROM source_observations obs
        JOIN sources s ON obs.source_id = s.id
        WHERE obs.variant_id = ?
    `).all(id);

    const powertrain = db.prepare(`
        SELECT pt.fuel_type, pt.secondary_fuel, e.displacement_cc, e.max_power_ps, e.max_torque_nm, t.transmission_type, t.gear_count, t.drive_type
        FROM powertrains pt
        LEFT JOIN engines e ON pt.engine_id = e.id
        LEFT JOIN transmissions t ON pt.transmission_id = t.id
        WHERE pt.id = ?
    `).get(variant.powertrain_id) || {};

    const formattedSpecs = {};
    for (const spec of specs) {
        formattedSpecs[spec.key] = {
            value: spec.numeric_value !== null ? spec.numeric_value : spec.value,
            unit: spec.unit,
            confidence: spec.confidence_state
        };
    }

    return {
        vehicle: {
            id: variant.id,
            manufacturer: variant.manufacturer_name,
            model: variant.model_name,
            variant: variant.canonical_variant_name,
            raw_variant_name: variant.raw_variant_name,
            model_year: variant.year,
            market: variant.country_code,
            status: variant.status
        },
        powertrain,
        specifications: formattedSpecs,
        features,
        prices,
        source_provenance: observations,
        data_quality: {
            completeness: variant.completeness_score,
            confidence: variant.confidence_score
        }
    };
}

export function searchVehicles(db, query, countryCode, { limit = 50, page = 1 } = {}) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
        return { manufacturers: [], models: [], trims: [] };
    }

    const trimmedQuery = query.trim();
    const pattern = `%${trimmedQuery}%`;
    const hasCountry = countryCode && typeof countryCode === 'string' && countryCode.trim() !== '';
    const normalizedCountry = hasCountry ? countryCode.trim().toUpperCase() : null;

    const parsedLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
    const parsedPage = Math.max(1, Number(page) || 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const matchingTrims = getTrims(db, { modelId: null, countryCode, year: null, limit: parsedLimit, page: parsedPage });
    const matchingVariants = db.prepare(`
        SELECT v.id, v.canonical_variant_name, v.year, v.country_code, m.name AS model_name, mfr.name AS manufacturer_name
        FROM variants v
        JOIN models m ON v.model_id = m.id
        JOIN manufacturers mfr ON m.manufacturer_id = mfr.id
        WHERE (v.raw_variant_name LIKE ? OR v.canonical_variant_name LIKE ? OR m.name LIKE ? OR mfr.name LIKE ?)
        ${hasCountry ? 'AND UPPER(v.country_code) = ?' : ''}
        LIMIT ? OFFSET ?
    `).all(...(hasCountry ? [pattern, pattern, pattern, pattern, normalizedCountry, parsedLimit, offset] : [pattern, pattern, pattern, pattern, parsedLimit, offset]));

    return {
        manufacturers: getManufacturers(db, countryCode),
        models: getModels(db, { countryCode }),
        trims: matchingTrims,
        variants: matchingVariants
    };
}

export function compareVehicles(db, ids) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    return ids.map(id => getVehicleById(db, id)).filter(Boolean);
}

export function getDataQualityMetrics(db) {
    const totalModelsRow = db.prepare('SELECT COUNT(*) AS count FROM models').get();
    const totalVariantsRow = db.prepare('SELECT COUNT(*) AS count FROM variants').get();
    const totalConflictsRow = db.prepare("SELECT COUNT(*) AS count FROM conflicts WHERE status = 'UNRESOLVED'").get();

    const totalModels = totalModelsRow ? totalModelsRow.count : 0;
    const totalVariants = totalVariantsRow ? totalVariantsRow.count : 0;
    const totalConflicts = totalConflictsRow ? totalConflictsRow.count : 0;

    const avgCompletenessRow = db.prepare('SELECT AVG(completeness_score) AS avg FROM variants').get();
    const avgConfidenceRow = db.prepare('SELECT AVG(confidence_score) AS avg FROM variants').get();

    const avgCompleteness = avgCompletenessRow && avgCompletenessRow.avg !== null ? avgCompletenessRow.avg : 0;
    const avgConfidence = avgConfidenceRow && avgConfidenceRow.avg !== null ? avgConfidenceRow.avg : 0;

    return {
        models_scanned: totalModels,
        variants_total: totalVariants,
        unresolved_conflicts: totalConflicts,
        average_completeness_pct: Math.round(avgCompleteness),
        average_confidence_score: parseFloat(Number(avgConfidence).toFixed(2))
    };
}

export function getDataQualityConflicts(db) {
    return db.prepare(`
        SELECT c.*, v.raw_variant_name, m.name AS model_name
        FROM conflicts c
        JOIN variants v ON c.variant_id = v.id
        JOIN models m ON v.model_id = m.id
        ORDER BY c.id DESC
    `).all();
}

export function getDataQualityMissing(db) {
    return db.prepare(`
        SELECT v.id, v.raw_variant_name, m.name AS model_name, v.completeness_score
        FROM variants v
        JOIN models m ON v.model_id = m.id
        WHERE v.completeness_score < 90
        ORDER BY v.completeness_score ASC
    `).all();
}

export function resolveConflict(db, conflictId, preferredValue, reason, resolvedBy = 'ADMIN') {
    db.prepare(`
        UPDATE conflicts
        SET preferred_value = ?, resolution_reason = ?, status = 'RESOLVED_MANUAL', resolved_at = ?, resolved_by = ?
        WHERE id = ?
    `).run(preferredValue, reason, new Date().toISOString(), resolvedBy, conflictId);

    return db.prepare('SELECT * FROM conflicts WHERE id = ?').get(conflictId);
}
