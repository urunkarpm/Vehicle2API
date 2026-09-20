import { indiaManufacturers, indiaModels, indiaGenerations, indiaFacelifts, indiaModelYears, indiaEngines, indiaTransmissions } from '../data/indiaVehiclesData.js';
import { indiaVariants } from '../data/indiaVariantsData.js';
import { normalizeFuel, normalizeTransmission, canonicalizeVariantName } from './normalizer.js';
import { validateVehicleRecord } from '../validation/validator.js';
import { detectFieldConflict, calculateCompleteness } from './scorer.js';

// ponytail: Ingest database populator -> Upgrade to distributed batch processing if catalog size > 1,000,000 variants.

export function runIngestionPipeline(db) {
    const insertSource = db.prepare(`
        INSERT OR IGNORE INTO sources (id, name, url, source_type, publisher, market, retrieved_at)
        VALUES (@id, @name, @url, @source_type, @publisher, @market, @retrieved_at)
    `);

    const insertMfr = db.prepare(`
        INSERT OR REPLACE INTO manufacturers (id, name, country_origin, official_website, active_in_india)
        VALUES (@id, @name, @country_origin, @official_website, @active_in_india)
    `);

    const insertModel = db.prepare(`
        INSERT OR REPLACE INTO models (id, manufacturer_id, name, body_type, segment, introduced_year, status)
        VALUES (@id, @manufacturer_id, @name, @body_type, @segment, @introduced_year, @status)
    `);

    const insertGen = db.prepare(`
        INSERT OR REPLACE INTO generations (id, model_id, generation_number, name, start_year, end_year)
        VALUES (@id, @model_id, @generation_number, @name, @start_year, @end_year)
    `);

    const insertFacelift = db.prepare(`
        INSERT OR REPLACE INTO facelifts (id, generation_id, name, release_year)
        VALUES (@id, @generation_id, @name, @release_year)
    `);

    const insertMY = db.prepare(`
        INSERT OR REPLACE INTO model_years (id, generation_id, facelift_id, year)
        VALUES (@id, @generation_id, @facelift_id, @year)
    `);

    const insertEngine = db.prepare(`
        INSERT OR REPLACE INTO engines (
            id, name, engine_code, displacement_cc, cylinders, configuration,
            aspiration, fuel_type, max_power_ps, power_rpm, max_torque_nm, torque_rpm,
            emission_standard, battery_capacity_kwh, ev_range_km
        ) VALUES (
            @id, @name, @engine_code, @displacement_cc, @cylinders, @configuration,
            @aspiration, @fuel_type, @max_power_ps, @power_rpm, @max_torque_nm, @torque_rpm,
            @emission_standard, @battery_capacity_kwh, @ev_range_km
        )
    `);

    const insertTrans = db.prepare(`
        INSERT OR REPLACE INTO transmissions (id, transmission_type, gear_count, drive_type)
        VALUES (@id, @transmission_type, @gear_count, @drive_type)
    `);

    const insertPowertrain = db.prepare(`
        INSERT OR REPLACE INTO powertrains (id, engine_id, transmission_id, fuel_type, secondary_fuel)
        VALUES (@id, @engine_id, @transmission_id, @fuel_type, @secondary_fuel)
    `);

    const insertVariant = db.prepare(`
        INSERT OR REPLACE INTO variants (
            id, model_id, generation_id, facelift_id, model_year_id, powertrain_id,
            country_code, raw_variant_name, canonical_variant_name, manufacturer_variant_name,
            year, body_type, seating_capacity, doors, status, available_from, available_until,
            completeness_score, confidence_score
        ) VALUES (
            @id, @model_id, @generation_id, @facelift_id, @model_year_id, @powertrain_id,
            @country_code, @raw_variant_name, @canonical_variant_name, @manufacturer_variant_name,
            @year, @body_type, @seating_capacity, @doors, @status, @available_from, @available_until,
            @completeness_score, @confidence_score
        )
    `);

    const insertSpec = db.prepare(`
        INSERT OR REPLACE INTO specifications (id, variant_id, category, key, value, numeric_value, unit, confidence_state)
        VALUES (@id, @variant_id, @category, @key, @value, @numeric_value, @unit, @confidence_state)
    `);

    const insertFeature = db.prepare(`
        INSERT OR REPLACE INTO variant_features (id, variant_id, category, feature_key, feature_name, is_standard, confidence_state)
        VALUES (@id, @variant_id, @category, @feature_key, @feature_name, @is_standard, @confidence_state)
    `);

    const insertPrice = db.prepare(`
        INSERT OR REPLACE INTO prices (id, variant_id, ex_showroom_price, market, currency, valid_from, source_name, retrieved_at)
        VALUES (@id, @variant_id, @ex_showroom_price, @market, @currency, @valid_from, @source_name, @retrieved_at)
    `);

    const insertObs = db.prepare(`
        INSERT OR REPLACE INTO source_observations (id, variant_id, field_name, raw_value, normalized_value, source_id, confidence, retrieved_at)
        VALUES (@id, @variant_id, @field_name, @raw_value, @normalized_value, @source_id, @confidence, @retrieved_at)
    `);

    const insertConflict = db.prepare(`
        INSERT OR REPLACE INTO conflicts (id, variant_id, field_name, competing_values, preferred_value, resolution_reason, status)
        VALUES (@id, @variant_id, @field_name, @competing_values, @preferred_value, @resolution_reason, @status)
    `);

    const insertLegacyTrim = db.prepare(`
        INSERT OR REPLACE INTO trims (
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
        INSERT OR REPLACE INTO vehicle_fts (trim_id, manufacturer, model, trim_name, country)
        VALUES (@trim_id, @manufacturer, @model, @trim_name, @country)
    `);

    const transaction = db.transaction(() => {
        // 1. Seed Manufacturers
        for (const mfr of indiaManufacturers) {
            insertMfr.run({
                official_website: null,
                active_in_india: 1,
                ...mfr
            });
        }

        // 2. Seed Models
        for (const model of indiaModels) {
            insertModel.run({
                segment: null,
                introduced_year: null,
                status: 'ACTIVE',
                ...model
            });
        }

        // 3. Seed Hierarchy
        for (const gen of indiaGenerations) {
            insertGen.run({
                generation_number: null,
                start_year: null,
                end_year: null,
                ...gen
            });
        }
        for (const fl of indiaFacelifts) {
            insertFacelift.run(fl);
        }
        for (const my of indiaModelYears) {
            insertMY.run({
                facelift_id: null,
                ...my
            });
        }

        // 4. Seed Engines, Transmissions & Powertrains
        for (const eng of indiaEngines) {
            insertEngine.run({
                name: null,
                engine_code: null,
                displacement_cc: null,
                cylinders: null,
                configuration: null,
                aspiration: null,
                max_power_ps: null,
                power_rpm: null,
                max_torque_nm: null,
                torque_rpm: null,
                emission_standard: null,
                battery_capacity_kwh: null,
                ev_range_km: null,
                ...eng
            });
        }
        for (const trans of indiaTransmissions) {
            insertTrans.run({
                gear_count: null,
                drive_type: 'FWD',
                ...trans
            });
        }

        // 5. Ingest Variants
        for (const varData of indiaVariants) {
            const engine = indiaEngines.find(e => e.id === varData.engine_id) || {};
            const trans = indiaTransmissions.find(t => t.id === varData.trans_id) || {};

            const fuelNorm = normalizeFuel(engine.fuel_type || 'PETROL');
            const transNorm = normalizeTransmission(trans.transmission_type || 'MANUAL');
            const canonicalName = varData.canonical_variant_name || canonicalizeVariantName(varData.raw_variant_name);

            // Powertrain linkage
            const powertrainId = `pt_${engine.id || 'eng'}_${trans.id || 'trans'}`;
            insertPowertrain.run({
                id: powertrainId,
                engine_id: engine.id || 'eng_unknown',
                transmission_id: trans.id || 'trans_unknown',
                fuel_type: fuelNorm.fuel_type,
                secondary_fuel: fuelNorm.secondary_fuel
            });

            // Validation
            const vehicleRecord = {
                manufacturer: indiaModels.find(m => m.id === varData.model_id)?.manufacturer_id,
                model: varData.model_id,
                variant: canonicalName,
                fuel_type: fuelNorm.fuel_type,
                transmission_type: transNorm.transmission_type,
                market: varData.country_code || 'IN',
                power_ps: engine.max_power_ps || varData.specs?.max_power_ps,
                torque_nm: engine.max_torque_nm || varData.specs?.max_torque_nm,
                displacement_cc: engine.displacement_cc || varData.specs?.displacement_cc,
                length_mm: varData.specs?.length_mm,
                width_mm: varData.specs?.width_mm,
                height_mm: varData.specs?.height_mm,
                wheelbase_mm: varData.specs?.wheelbase_mm,
                fuel_tank_l: varData.specs?.fuel_tank_l,
                battery_capacity_kwh: engine.battery_capacity_kwh
            };
            const validation = validateVehicleRecord(vehicleRecord);

            // Conflict detection on observations
            const obsByField = new Map();
            if (varData.observations) {
                for (const obs of varData.observations) {
                    if (!obsByField.has(obs.field)) obsByField.set(obs.field, []);
                    obsByField.get(obs.field).push(obs);
                }
            }

            for (const [field, obsList] of obsByField.entries()) {
                const conflictResult = detectFieldConflict(field, obsList);
                if (conflictResult && conflictResult.hasConflict) {
                    insertConflict.run({
                        id: `conflict_${varData.id}_${field}`,
                        variant_id: varData.id,
                        field_name: field,
                        competing_values: JSON.stringify(conflictResult.competingValues),
                        preferred_value: String(conflictResult.preferredValue),
                        resolution_reason: conflictResult.preferredReason,
                        status: 'UNRESOLVED'
                    });
                }
            }

            // Completeness scoring
            const completeness = calculateCompleteness({
                specifications: {
                    fuel_type: fuelNorm.fuel_type,
                    transmission_type: transNorm.transmission_type,
                    displacement_cc: engine.displacement_cc,
                    max_power_ps: engine.max_power_ps || varData.specs?.max_power_ps,
                    max_torque_nm: engine.max_torque_nm || varData.specs?.max_torque_nm,
                    ...varData.specs
                },
                features: varData.features,
                prices: [{ ex_showroom_price: varData.ex_showroom_price }],
                observations: varData.observations
            });

            insertVariant.run({
                id: varData.id,
                model_id: varData.model_id,
                generation_id: varData.generation_id || null,
                facelift_id: varData.facelift_id || null,
                model_year_id: varData.model_year_id || null,
                powertrain_id: powertrainId,
                country_code: varData.country_code || 'IN',
                raw_variant_name: varData.raw_variant_name,
                canonical_variant_name: canonicalName,
                manufacturer_variant_name: varData.manufacturer_variant_name || varData.raw_variant_name,
                year: varData.year,
                body_type: varData.body_type,
                seating_capacity: varData.seating_capacity || 5,
                doors: varData.doors || 5,
                status: varData.status || 'ACTIVE',
                available_from: varData.available_from || `${varData.year}-01-01`,
                available_until: varData.available_until || null,
                completeness_score: completeness.overall,
                confidence_score: validation.isValid ? 0.95 : 0.70
            });

            // Specifications
            if (varData.specs) {
                for (const [key, val] of Object.entries(varData.specs)) {
                    insertSpec.run({
                        id: `spec_${varData.id}_${key}`,
                        variant_id: varData.id,
                        category: key.includes('mm') || key.includes('kg') || key.includes('space') || key.includes('tank') ? 'Dimensions' : 'Engine',
                        key,
                        value: String(val),
                        numeric_value: typeof val === 'number' ? val : parseFloat(val) || null,
                        unit: key.includes('mm') ? 'mm' : key.includes('kg') ? 'kg' : key.includes('kpl') ? 'km/l' : key.includes('ps') ? 'PS' : key.includes('nm') ? 'Nm' : null,
                        confidence_state: 'VERIFIED'
                    });
                }
            }

            // Features
            if (varData.features) {
                for (const feat of varData.features) {
                    insertFeature.run({
                        id: `feat_${varData.id}_${feat.key}`,
                        variant_id: varData.id,
                        category: feat.category,
                        feature_key: feat.key,
                        feature_name: feat.name,
                        is_standard: feat.is_standard !== undefined ? feat.is_standard : 1,
                        confidence_state: 'VERIFIED'
                    });
                }
            }

            // Pricing
            if (varData.ex_showroom_price) {
                insertPrice.run({
                    id: `price_${varData.id}_in`,
                    variant_id: varData.id,
                    ex_showroom_price: varData.ex_showroom_price,
                    market: 'IN',
                    currency: 'INR',
                    valid_from: `${varData.year}-01-01`,
                    source_name: 'Official Price List',
                    retrieved_at: new Date().toISOString()
                });
            }

            // Sources & Observations
            if (varData.observations) {
                for (const obs of varData.observations) {
                    const sourceId = `src_${obs.source_name.toLowerCase().replace(/\s+/g, '_')}`;
                    insertSource.run({
                        id: sourceId,
                        name: obs.source_name,
                        url: null,
                        source_type: obs.source_type,
                        publisher: obs.source_name,
                        market: 'IN',
                        retrieved_at: new Date().toISOString()
                    });

                    insertObs.run({
                        id: `obs_${varData.id}_${obs.field}_${sourceId}`,
                        variant_id: varData.id,
                        field_name: obs.field,
                        raw_value: obs.raw,
                        normalized_value: obs.norm,
                        source_id: sourceId,
                        confidence: obs.confidence,
                        retrieved_at: new Date().toISOString()
                    });
                }
            }

            // Synchronize with legacy trims table & FTS
            const modelObj = indiaModels.find(m => m.id === varData.model_id);
            const mfrObj = indiaManufacturers.find(m => m.id === modelObj?.manufacturer_id);

            insertLegacyTrim.run({
                id: varData.id,
                model_id: varData.model_id,
                country_code: varData.country_code || 'IN',
                trim_name: varData.raw_variant_name,
                year: varData.year,
                engine: engine.name || '1.5L',
                transmission: trans.transmission_type || 'Manual',
                drivetrain: trans.drive_type || 'FWD',
                fuel_type: fuelNorm.fuel_type,
                power_hp: Math.round((engine.max_power_ps || 100) * 0.986),
                price_local: `₹${(varData.ex_showroom_price || 0).toLocaleString('en-IN')}`,
                on_sale: varData.status === 'ACTIVE' ? 1 : 0
            });

            insertFts.run({
                trim_id: varData.id,
                manufacturer: mfrObj ? mfrObj.name : '',
                model: modelObj ? modelObj.name : '',
                trim_name: varData.raw_variant_name,
                country: varData.country_code || 'IN'
            });
        }
    });

    transaction();
}
