import test, { before, after } from 'node:test';
import assert from 'node:assert';
import { initDb } from '../src/db.js';
import { seedDatabase, getVehicleById, getDataQualityMetrics, getDataQualityConflicts, resolveConflict } from '../src/models.js';
import { createApp } from '../src/app.js';
import { normalizeFuel, normalizeTransmission, canonicalizeVariantName } from '../src/pipeline/normalizer.js';
import { validateVehicleRecord } from '../src/validation/validator.js';
import { detectFieldConflict, calculateCompleteness } from '../src/pipeline/scorer.js';

let db;
let server;
let baseUrl;

before(async () => {
    db = initDb(':memory:');
    seedDatabase(db);

    const app = createApp(db);
    server = app.listen(0);
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
    if (server) server.close();
    if (db) db.close();
});

test('Normalizer formats fuels, transmissions, and variant names', () => {
    assert.deepStrictEqual(normalizeFuel('Petrol/CNG'), { fuel_type: 'CNG', secondary_fuel: 'PETROL' });
    assert.deepStrictEqual(normalizeFuel('Strong Hybrid'), { fuel_type: 'STRONG_HYBRID', secondary_fuel: 'PETROL' });
    assert.deepStrictEqual(normalizeFuel('Electric'), { fuel_type: 'ELECTRIC', secondary_fuel: null });

    assert.strictEqual(normalizeTransmission('7-Speed DCA').transmission_type, 'DCT');
    assert.strictEqual(normalizeTransmission('6-Speed AMT').transmission_type, 'AMT');
    assert.strictEqual(normalizeTransmission('Manual 5 Speed').transmission_type, 'MANUAL');

    assert.strictEqual(canonicalizeVariantName('SX  (O) '), 'SX(O)');
    assert.strictEqual(canonicalizeVariantName('SX O Turbo'), 'SX(O) Turbo');
});

test('Validator flags impossible combinations and invalid figures', () => {
    const valid = validateVehicleRecord({
        manufacturer: 'hyundai',
        model: 'hyundai-creta',
        variant: 'SX(O)',
        fuel_type: 'PETROL',
        transmission_type: 'MANUAL',
        market: 'IN',
        power_ps: 115,
        length_mm: 4330,
        wheelbase_mm: 2610
    });
    assert.strictEqual(valid.isValid, true);

    const invalid = validateVehicleRecord({
        manufacturer: 'hyundai',
        model: 'hyundai-creta',
        variant: 'SX(O)',
        fuel_type: 'ELECTRIC',
        transmission_type: 'MANUAL',
        market: 'IN',
        power_ps: 115,
        fuel_tank_l: 50 // EV cannot have fuel tank
    });
    assert.strictEqual(invalid.isValid, false);
    assert.ok(invalid.errors.some(e => e.rule === 'EV_WITH_FUEL_TANK'));
});

test('Conflict detector isolates variances and selects preferred values', () => {
    const obs = [
        { source_name: 'Official Brochure', source_type: 'TIER_1_OFFICIAL', field: 'ground_clearance', value: '190', confidence: 0.98 },
        { source_name: 'Publication A', source_type: 'TIER_2_PUBLICATION', field: 'ground_clearance', value: '195', confidence: 0.85 }
    ];
    const res = detectFieldConflict('ground_clearance', obs);
    assert.strictEqual(res.hasConflict, true);
    assert.strictEqual(res.preferredValue, '190');
});

test('GET /api/v1/vehicles returns normalized Indian vehicle list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/vehicles`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.vehicles));
    assert.ok(body.vehicles.length >= 5);
});

test('GET /api/v1/vehicles/:id returns detailed vehicle with quality score and provenance', async () => {
    const res = await fetch(`${baseUrl}/api/v1/vehicles/hyundai-creta-2024-sxo-15-diesel-at`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.vehicle.variant, 'SX(O)');
    assert.strictEqual(body.vehicle.market, 'IN');
    assert.ok(body.powertrain);
    assert.ok(body.specifications);
    assert.ok(body.features.length > 0);
    assert.ok(body.data_quality.completeness >= 80);
});

test('GET /api/v1/compare compares multiple vehicles', async () => {
    const res = await fetch(`${baseUrl}/api/v1/compare?vehicles=hyundai-creta-2024-sxo-15-diesel-at,tata-nexon-2024-smart-12-petrol`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.comparison.length, 2);
});

test('Data Quality metrics and conflict resolution endpoints work', async () => {
    const resMetrics = await fetch(`${baseUrl}/api/v1/data-quality`);
    assert.strictEqual(resMetrics.status, 200);
    const metricsBody = await resMetrics.json();
    assert.ok(metricsBody.metrics.variants_total > 0);

    const resConflicts = await fetch(`${baseUrl}/api/v1/data-quality/conflicts`);
    assert.strictEqual(resConflicts.status, 200);
    const conflictsBody = await resConflicts.json();
    assert.ok(Array.isArray(conflictsBody.conflicts));

    if (conflictsBody.conflicts.length > 0) {
        const conflictId = conflictsBody.conflicts[0].id;
        const resResolve = await fetch(`${baseUrl}/api/v1/admin/conflicts/${conflictId}/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preferred_value: '190', reason: 'Verified via Brochure' })
        });
        assert.strictEqual(resResolve.status, 200);
        const resolveBody = await resResolve.json();
        assert.strictEqual(resolveBody.status, 'RESOLVED');
    }
});
