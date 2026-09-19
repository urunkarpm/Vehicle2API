import express from 'express';
import { initDb } from './db.js';
import {
    getCountries,
    getManufacturers,
    getModels,
    getTrims,
    searchVehicles
} from './models.js';
import { decodeVin } from './nhtsaProxy.js';

// ponytail: SQLite single-file DB -> Upgrade to PostgreSQL/MySQL if concurrent writes > 10,000 req/sec.

export function createApp(db = initDb(), options = {}) {
    const { vinDecoder = decodeVin } = options;
    const app = express();

    app.use(express.json());

    // CORS headers middleware
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }
        next();
    });

    // Health check and system metrics
    app.get('/health', (req, res) => {
        try {
            const totalCountries = db.prepare('SELECT COUNT(*) AS count FROM countries').get().count;
            const totalManufacturers = db.prepare('SELECT COUNT(*) AS count FROM manufacturers').get().count;
            const totalModels = db.prepare('SELECT COUNT(*) AS count FROM models').get().count;
            const totalTrims = db.prepare('SELECT COUNT(*) AS count FROM trims').get().count;

            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                metrics: {
                    total_countries: totalCountries,
                    total_manufacturers: totalManufacturers,
                    total_models: totalModels,
                    total_trims: totalTrims
                }
            });
        } catch (err) {
            res.status(500).json({
                status: 'ERROR',
                error: err.message
            });
        }
    });

    // Countries list
    app.get('/api/v1/countries', (req, res) => {
        try {
            const countries = getCountries(db);
            res.status(200).json({ countries });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Manufacturers list with optional country filtering
    app.get('/api/v1/manufacturers', (req, res) => {
        try {
            const country = req.query.country || req.query.country_code || req.query.countryCode;
            const manufacturers = getManufacturers(db, country);
            res.status(200).json({ manufacturers });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Models list with optional manufacturer, country, and body_type filtering
    app.get('/api/v1/models', (req, res) => {
        try {
            const manufacturerId = req.query.manufacturer || req.query.manufacturer_id || req.query.manufacturerId;
            const countryCode = req.query.country || req.query.country_code || req.query.countryCode;
            const bodyType = req.query.body_type || req.query.bodyType;

            const models = getModels(db, { manufacturerId, countryCode, bodyType });
            res.status(200).json({ models });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Trims list with model, country, year, on_sale filtering
    app.get('/api/v1/trims', (req, res) => {
        try {
            const modelId = req.query.model || req.query.model_id || req.query.modelId;
            const countryCode = req.query.country || req.query.country_code || req.query.countryCode;
            const year = req.query.year;
            const onSale = req.query.on_sale !== undefined ? req.query.on_sale : req.query.onSale;

            const trims = getTrims(db, { modelId, countryCode, year, onSale });
            res.status(200).json({ trims });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Cross-entity vehicle search
    app.get('/api/v1/search', (req, res) => {
        try {
            const q = req.query.q || req.query.query || '';
            const country = req.query.country || req.query.country_code || req.query.countryCode;

            const results = searchVehicles(db, q, country);
            res.status(200).json({
                query: q,
                results
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Dynamic NHTSA VIN decoder proxy
    app.get('/api/v1/nhtsa/decode/:vin', async (req, res) => {
        try {
            const { vin } = req.params;
            const vehicle = await vinDecoder(vin);
            res.status(200).json(vehicle);
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // 404 handler for unknown routes
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found', path: req.path });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    });

    return app;
}
