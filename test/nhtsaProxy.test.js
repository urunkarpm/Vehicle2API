import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { normalizeNhtsaResponse, decodeVin } from '../src/nhtsaProxy.js';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db.js';

test('normalizeNhtsaResponse formats NHTSA API output', () => {
    const rawNhtsa = {
        Results: [
            { Variable: 'Make', Value: 'TOYOTA' },
            { Variable: 'Model', Value: 'Corolla' },
            { Variable: 'Model Year', Value: '2024' },
            { Variable: 'Trim', Value: 'LE' },
            { Variable: 'Plant Country', Value: 'UNITED STATES (USA)' },
            { Variable: 'Displacement (L)', Value: '2.0' },
            { Variable: 'Engine Number of Cylinders', Value: '4' }
        ]
    };

    const normalized = normalizeNhtsaResponse(rawNhtsa);
    assert.strictEqual(normalized.manufacturer, 'TOYOTA');
    assert.strictEqual(normalized.model, 'Corolla');
    assert.strictEqual(normalized.year, '2024');
    assert.strictEqual(normalized.trim, 'LE');
    assert.strictEqual(normalized.plant_country, 'UNITED STATES (USA)');
    assert.strictEqual(normalized.engine_specs.displacement_l, '2.0');
    assert.strictEqual(normalized.engine_specs.cylinders, '4');
});

test('normalizeNhtsaResponse handles missing or invalid input gracefully', () => {
    assert.strictEqual(normalizeNhtsaResponse(null), null);
    assert.strictEqual(normalizeNhtsaResponse(undefined), null);
    assert.strictEqual(normalizeNhtsaResponse('invalid'), null);
    assert.strictEqual(normalizeNhtsaResponse({}), null);

    const emptyNormalized = normalizeNhtsaResponse({ Results: [] });
    assert.strictEqual(emptyNormalized.manufacturer, null);
    assert.strictEqual(emptyNormalized.model, null);
    assert.strictEqual(emptyNormalized.year, null);
    assert.strictEqual(emptyNormalized.trim, null);
});

test('decodeVin validates VIN parameter', async () => {
    await assert.rejects(
        () => decodeVin(''),
        err => err.status === 400 && err.message.includes('VIN is required')
    );

    await assert.rejects(
        () => decodeVin('INVALID VIN WITH SPACES!'),
        err => err.status === 400 && err.message.includes('Invalid VIN format')
    );

    await assert.rejects(
        () => decodeVin('TOOLONGVINTOOLONGVINTOOLONG'),
        err => err.status === 400 && err.message.includes('Invalid VIN format')
    );
});

test('decodeVin calls NHTSA endpoint and normalizes output', async () => {
    const mockRaw = {
        Results: [
            { Variable: 'Make', Value: 'TESLA' },
            { Variable: 'Model', Value: 'Model 3' },
            { Variable: 'Model Year', Value: '2023' },
            { Variable: 'Trim', Value: 'Performance' },
            { Variable: 'Plant Country', Value: 'UNITED STATES (USA)' },
            { Variable: 'Vehicle Type', Value: 'PASSENGER CAR' },
            { Variable: 'Fuel Type - Primary', Value: 'Electric' }
        ]
    };

    let requestedUrl = '';
    const mockFetch = async (url) => {
        requestedUrl = url;
        return {
            ok: true,
            status: 200,
            json: async () => mockRaw
        };
    };

    const result = await decodeVin('5YJ3E1EB8PF123456', { fetchFn: mockFetch });
    assert.ok(requestedUrl.includes('5YJ3E1EB8PF123456?format=json'));
    assert.strictEqual(result.manufacturer, 'TESLA');
    assert.strictEqual(result.model, 'Model 3');
    assert.strictEqual(result.year, '2023');
    assert.strictEqual(result.trim, 'Performance');
    assert.strictEqual(result.vehicle_type, 'PASSENGER CAR');
    assert.strictEqual(result.engine_specs.fuel_type, 'Electric');
});

test('decodeVin handles network failures, timeouts, and HTTP errors', async () => {
    // Network failure
    const networkFailFetch = async () => {
        throw new TypeError('Failed to fetch');
    };
    await assert.rejects(
        () => decodeVin('5YJ3E1EB8PF123456', { fetchFn: networkFailFetch }),
        err => err.status === 502 && err.message.includes('network error')
    );

    // Timeout failure
    const timeoutFetch = async () => {
        const err = new Error('The operation was aborted');
        err.name = 'TimeoutError';
        throw err;
    };
    await assert.rejects(
        () => decodeVin('5YJ3E1EB8PF123456', { fetchFn: timeoutFetch }),
        err => err.status === 504 && err.message.includes('timed out')
    );

    // Upstream HTTP 500 error
    const httpErrorFetch = async () => ({
        ok: false,
        status: 500
    });
    await assert.rejects(
        () => decodeVin('5YJ3E1EB8PF123456', { fetchFn: httpErrorFetch }),
        err => err.status === 502 && err.message.includes('responded with status 500')
    );

    // Upstream invalid JSON
    const badJsonFetch = async () => ({
        ok: true,
        status: 200,
        json: async () => { throw new Error('Unexpected token'); }
    });
    await assert.rejects(
        () => decodeVin('5YJ3E1EB8PF123456', { fetchFn: badJsonFetch }),
        err => err.status === 502 && err.message.includes('JSON response')
    );
});

let server;
let baseUrl;

before(async () => {
    const db = initDb(':memory:');
    const mockDecoder = async (vin) => {
        if (vin === 'INVALID') {
            const err = new Error('Invalid VIN format: Must be 3 to 17 alphanumeric characters');
            err.status = 400;
            throw err;
        }
        if (vin === 'TIMEOUT') {
            const err = new Error('NHTSA API request timed out');
            err.status = 504;
            throw err;
        }
        return {
            vin,
            manufacturer: 'HONDA',
            model: 'Civic',
            year: '2024',
            trim: 'Sport',
            vehicle_type: 'PASSENGER CAR',
            plant_country: 'JAPAN',
            engine_specs: {
                displacement_l: '2.0',
                cylinders: '4',
                fuel_type: 'Gasoline',
                horsepower: '158'
            }
        };
    };

    const app = createApp(db, { vinDecoder: mockDecoder });
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
});

after(() => {
    server?.close();
});

test('GET /api/v1/nhtsa/decode/:vin returns 200 and decoded vehicle', async () => {
    const res = await fetch(`${baseUrl}/api/v1/nhtsa/decode/1HGCG5653WA000000`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.manufacturer, 'HONDA');
    assert.strictEqual(body.model, 'Civic');
    assert.strictEqual(body.year, '2024');
    assert.strictEqual(body.trim, 'Sport');
    assert.strictEqual(body.engine_specs.displacement_l, '2.0');
});

test('GET /api/v1/nhtsa/decode/:vin returns 400 for invalid VIN', async () => {
    const res = await fetch(`${baseUrl}/api/v1/nhtsa/decode/INVALID`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('Invalid VIN'));
});

test('GET /api/v1/nhtsa/decode/:vin returns 504 when upstream times out', async () => {
    const res = await fetch(`${baseUrl}/api/v1/nhtsa/decode/TIMEOUT`);
    assert.strictEqual(res.status, 504);
    const body = await res.json();
    assert.ok(body.error.includes('timed out'));
});
