import { countries, manufacturers, models, trims } from './seedData.js';

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
}


export function getCountries(db) {
    return db.prepare('SELECT code, name, region FROM countries ORDER BY name ASC').all();
}

export function getManufacturers(db, countryCode) {
    if (countryCode && typeof countryCode === 'string' && countryCode.trim() !== '') {
        const normalized = countryCode.trim().toUpperCase();
        return db.prepare(`
            SELECT DISTINCT m.id, m.name, m.country_origin
            FROM manufacturers m
            WHERE UPPER(m.country_origin) = ?
               OR EXISTS (
                   SELECT 1 FROM models mo
                   JOIN trims t ON t.model_id = mo.id
                   WHERE mo.manufacturer_id = m.id AND UPPER(t.country_code) = ?
               )
            ORDER BY m.name ASC
        `).all(normalized, normalized);
    }
    return db.prepare('SELECT id, name, country_origin FROM manufacturers ORDER BY name ASC').all();
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
            EXISTS (
                SELECT 1 FROM trims t
                WHERE t.model_id = m.id AND UPPER(t.country_code) = UPPER(?)
            )
        `);
        params.push(countryCode.trim());
    }

    let query = `
        SELECT DISTINCT m.id, m.manufacturer_id, m.name, m.body_type
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

    // FTS5 query attempt
    try {
        let ftsQuery = `
            SELECT DISTINCT t.*
            FROM vehicle_fts f
            JOIN trims t ON f.trim_id = t.id
            WHERE vehicle_fts MATCH ?
        `;
        const ftsParams = [trimmedQuery + '*'];
        if (hasCountry) {
            ftsQuery += ' AND UPPER(t.country_code) = ?';
            ftsParams.push(normalizedCountry);
        }
        ftsQuery += ' ORDER BY t.year DESC LIMIT ? OFFSET ?';
        ftsParams.push(parsedLimit, offset);

        const ftsTrims = db.prepare(ftsQuery).all(...ftsParams);
        if (ftsTrims.length > 0) {
            const modelIds = [...new Set(ftsTrims.map(t => t.model_id))];
            const modelsResult = db.prepare(`SELECT * FROM models WHERE id IN (${modelIds.map(() => '?').join(',')})`).all(...modelIds);
            const mfrIds = [...new Set(modelsResult.map(m => m.manufacturer_id))];
            const mfrsResult = db.prepare(`SELECT * FROM manufacturers WHERE id IN (${mfrIds.map(() => '?').join(',')})`).all(...mfrIds);

            return {
                manufacturers: mfrsResult,
                models: modelsResult,
                trims: ftsTrims
            };
        }
    } catch (e) {
        // Fallback to standard LIKE queries if FTS input contains unescaped symbols
    }

    let mfrQuery = `
        SELECT DISTINCT m.id, m.name, m.country_origin
        FROM manufacturers m
        WHERE (m.name LIKE ? OR m.id LIKE ?)
    `;
    const mfrParams = [pattern, pattern];
    if (hasCountry) {
        mfrQuery += `
            AND (
                UPPER(m.country_origin) = ?
                OR EXISTS (
                    SELECT 1 FROM models mo
                    JOIN trims t ON t.model_id = mo.id
                    WHERE mo.manufacturer_id = m.id AND UPPER(t.country_code) = ?
                )
            )
        `;
        mfrParams.push(normalizedCountry, normalizedCountry);
    }
    mfrQuery += ' ORDER BY m.name ASC LIMIT ? OFFSET ?';
    mfrParams.push(parsedLimit, offset);
    const matchingMfrs = db.prepare(mfrQuery).all(...mfrParams);

    let modelQuery = `
        SELECT DISTINCT mo.id, mo.manufacturer_id, mo.name, mo.body_type
        FROM models mo
        JOIN manufacturers m ON mo.manufacturer_id = m.id
        WHERE (mo.name LIKE ? OR mo.id LIKE ? OR mo.body_type LIKE ? OR m.name LIKE ?)
    `;
    const modelParams = [pattern, pattern, pattern, pattern];
    if (hasCountry) {
        modelQuery += `
            AND EXISTS (
                SELECT 1 FROM trims t
                WHERE t.model_id = mo.id AND UPPER(t.country_code) = ?
            )
        `;
        modelParams.push(normalizedCountry);
    }
    modelQuery += ' ORDER BY mo.name ASC LIMIT ? OFFSET ?';
    modelParams.push(parsedLimit, offset);
    const matchingModels = db.prepare(modelQuery).all(...modelParams);

    let trimQuery = `
        SELECT DISTINCT t.*
        FROM trims t
        JOIN models mo ON t.model_id = mo.id
        JOIN manufacturers m ON mo.manufacturer_id = m.id
        WHERE (
            t.trim_name LIKE ?
            OR t.engine LIKE ?
            OR t.fuel_type LIKE ?
            OR mo.name LIKE ?
            OR m.name LIKE ?
        )
    `;
    const trimParams = [pattern, pattern, pattern, pattern, pattern];
    if (hasCountry) {
        trimQuery += ' AND UPPER(t.country_code) = ?';
        trimParams.push(normalizedCountry);
    }
    trimQuery += ' ORDER BY t.year DESC, t.trim_name ASC, t.id ASC LIMIT ? OFFSET ?';
    trimParams.push(parsedLimit, offset);
    const matchingTrims = db.prepare(trimQuery).all(...trimParams);

    return {
        manufacturers: matchingMfrs,
        models: matchingModels,
        trims: matchingTrims
    };
}

