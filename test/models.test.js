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
    assert.ok(countries.length >= 9, 'Should have at least 9 countries');
    const us = countries.find(c => c.code === 'US');
    assert.ok(us);
    assert.strictEqual(us.name, 'United States');
    assert.strictEqual(us.region, 'North America');

    const expectedCodes = ['US', 'IN', 'DE', 'UK', 'JP', 'CN', 'AU', 'BR', 'AE'];
    for (const code of expectedCodes) {
        assert.ok(countries.some(c => c.code === code), `Missing country code: ${code}`);
    }
});

test('getManufacturers filters by country origin or active trims', () => {
    const allMfrs = getManufacturers(db);
    assert.ok(allMfrs.length >= 10, 'Should have at least 10 manufacturers');

    const expectedMfrIds = [
        'toyota', 'tata', 'tesla', 'ford', 'bmw',
        'byd', 'volkswagen', 'maruti-suzuki', 'mahindra', 'hyundai'
    ];
    for (const id of expectedMfrIds) {
        assert.ok(allMfrs.some(m => m.id === id), `Missing manufacturer: ${id}`);
    }

    const usMfrs = getManufacturers(db, 'US');
    assert.ok(usMfrs.length > 0);
    assert.ok(usMfrs.some(m => m.id === 'ford' || m.id === 'tesla'));

    const inMfrs = getManufacturers(db, 'IN');
    assert.ok(inMfrs.length > 0);
    assert.ok(inMfrs.some(m => m.id === 'tata' || m.id === 'mahindra'));

    const deMfrs = getManufacturers(db, 'DE');
    assert.ok(deMfrs.length > 0);
    assert.ok(deMfrs.some(m => m.id === 'bmw' || m.id === 'volkswagen'));

    const unknownMfrs = getManufacturers(db, 'ZZ');
    assert.strictEqual(unknownMfrs.length, 0);
});

test('getModels filters by manufacturer, country, and body type', () => {
    const allModels = getModels(db, {});
    assert.ok(allModels.length >= 10, 'Should have multiple models');

    const toyotaModels = getModels(db, { manufacturerId: 'toyota' });
    assert.ok(toyotaModels.length > 0);
    assert.ok(toyotaModels.every(m => m.manufacturer_id === 'toyota'));

    const suvModels = getModels(db, { bodyType: 'SUV' });
    assert.ok(suvModels.length > 0);
    assert.ok(suvModels.every(m => m.body_type === 'SUV'));

    const inModels = getModels(db, { countryCode: 'IN' });
    assert.ok(inModels.length > 0);

    const emptyFilter = getModels(db);
    assert.strictEqual(emptyFilter.length, allModels.length);
});

test('getTrims filters trims by model and country', () => {
    const trims = getTrims(db, { modelId: 'toyota-corolla', countryCode: 'US' });
    assert.ok(trims.length > 0);
    assert.strictEqual(trims[0].trim_name, 'LE');
    assert.ok(trims[0].year);
    assert.ok(trims[0].price_local);
    assert.ok(trims[0].power_hp);

    const onSaleTrims = getTrims(db, { modelId: 'toyota-corolla', countryCode: 'US', onSale: true });
    assert.ok(onSaleTrims.length > 0);
    assert.ok(onSaleTrims.every(t => t.on_sale === 1));

    const specificYearTrims = getTrims(db, { year: 2024 });
    assert.ok(specificYearTrims.length > 0);
    assert.ok(specificYearTrims.every(t => t.year === 2024));

    // Verify all 9 countries have trim representations
    const expectedCountries = ['US', 'IN', 'DE', 'UK', 'JP', 'CN', 'AU', 'BR', 'AE'];
    for (const code of expectedCountries) {
        const countryTrims = getTrims(db, { countryCode: code });
        assert.ok(countryTrims.length > 0, `Country ${code} should have trims`);
    }
});

test('searchVehicles returns matching items', () => {
    const results = searchVehicles(db, 'Nexon');
    assert.ok(results.trims.length > 0 || results.models.length > 0);
    assert.ok(results.manufacturers !== undefined);
    assert.ok(results.models !== undefined);
    assert.ok(results.trims !== undefined);

    const teslaResults = searchVehicles(db, 'Tesla');
    assert.ok(teslaResults.manufacturers.some(m => m.name.toLowerCase().includes('tesla')));

    const countryFiltered = searchVehicles(db, 'Toyota', 'US');
    assert.ok(countryFiltered.manufacturers.length > 0 || countryFiltered.models.length > 0 || countryFiltered.trims.length > 0);

    // Empty search handling
    const emptyResults = searchVehicles(db, '');
    assert.deepStrictEqual(emptyResults, { manufacturers: [], models: [], trims: [] });

    const nullResults = searchVehicles(db, null);
    assert.deepStrictEqual(nullResults, { manufacturers: [], models: [], trims: [] });
});

test('seedDatabase is idempotent', () => {
    assert.doesNotThrow(() => {
        seedDatabase(db);
    });
    const countries = getCountries(db);
    assert.ok(countries.length >= 9);
});
