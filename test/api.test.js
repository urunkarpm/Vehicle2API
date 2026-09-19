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
    assert.ok(body.metrics.total_countries > 0);
    assert.ok(body.metrics.total_manufacturers > 0);
    assert.ok(body.metrics.total_models > 0);
});

test('GET /api/v1/countries returns countries array', async () => {
    const res = await fetch(`${baseUrl}/api/v1/countries`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.countries));
    assert.ok(body.countries.length >= 9);
    assert.ok(body.countries.some(c => c.code === 'US'));
});

test('GET /api/v1/manufacturers returns manufacturers array and supports country filter', async () => {
    const resAll = await fetch(`${baseUrl}/api/v1/manufacturers`);
    assert.strictEqual(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.ok(Array.isArray(bodyAll.manufacturers));
    assert.ok(bodyAll.manufacturers.length >= 10);

    const resIn = await fetch(`${baseUrl}/api/v1/manufacturers?country=IN`);
    assert.strictEqual(resIn.status, 200);
    const bodyIn = await resIn.json();
    assert.ok(Array.isArray(bodyIn.manufacturers));
    assert.ok(bodyIn.manufacturers.some(m => m.id === 'tata' || m.id === 'mahindra'));
});

test('GET /api/v1/models returns models and supports filtering', async () => {
    const resAll = await fetch(`${baseUrl}/api/v1/models`);
    assert.strictEqual(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.ok(Array.isArray(bodyAll.models));
    assert.ok(bodyAll.models.length >= 10);

    const resMfr = await fetch(`${baseUrl}/api/v1/models?manufacturer=toyota`);
    assert.strictEqual(resMfr.status, 200);
    const bodyMfr = await resMfr.json();
    assert.ok(bodyMfr.models.length > 0);
    assert.ok(bodyMfr.models.every(m => m.manufacturer_id === 'toyota'));

    const resSuv = await fetch(`${baseUrl}/api/v1/models?body_type=SUV`);
    assert.strictEqual(resSuv.status, 200);
    const bodySuv = await resSuv.json();
    assert.ok(bodySuv.models.length > 0);
    assert.ok(bodySuv.models.every(m => m.body_type === 'SUV'));
});

test('GET /api/v1/trims returns trims matching query', async () => {
    const res = await fetch(`${baseUrl}/api/v1/trims?model=toyota-corolla&country=US`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.trims));
    assert.ok(body.trims.length > 0);
    assert.strictEqual(body.trims[0].trim_name, 'LE');

    const resSale = await fetch(`${baseUrl}/api/v1/trims?model=toyota-corolla&country=US&on_sale=true`);
    assert.strictEqual(resSale.status, 200);
    const bodySale = await resSale.json();
    assert.ok(bodySale.trims.length > 0);
    assert.ok(bodySale.trims.every(t => t.on_sale === 1));
});

test('GET /api/v1/search returns matching results', async () => {
    const res = await fetch(`${baseUrl}/api/v1/search?q=Tesla`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.results);
    assert.ok(body.results.manufacturers.some(m => m.name.toLowerCase().includes('tesla')));

    const resEmpty = await fetch(`${baseUrl}/api/v1/search?q=`);
    assert.strictEqual(resEmpty.status, 200);
    const bodyEmpty = await resEmpty.json();
    assert.deepStrictEqual(bodyEmpty.results, { manufacturers: [], models: [], trims: [] });
});

test('GET /api/v1/unknown returns 404 Not Found', async () => {
    const res = await fetch(`${baseUrl}/api/v1/unknown`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.error, 'Not Found');
});
