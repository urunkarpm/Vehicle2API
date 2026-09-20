import express from 'express';
import { initDb } from './db.js';
import {
    getCountries,
    getManufacturers,
    getModels,
    getGenerations,
    getTrims,
    searchVehicles,
    getVehicleById,
    compareVehicles,
    getDataQualityMetrics,
    getDataQualityConflicts,
    getDataQualityMissing,
    resolveConflict
} from './models.js';
import { decodeVin } from './nhtsaProxy.js';

// ponytail: Express REST API Router -> Upgrade to Fastify/gRPC if throughput requires > 50,000 req/sec per node.

export function createApp(db = initDb(), options = {}) {
    const { vinDecoder = decodeVin } = options;
    const app = express();

    app.use(express.json());
    app.use(express.static('public'));

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
            const totalVariants = db.prepare('SELECT COUNT(*) AS count FROM variants').get().count;

            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                metrics: {
                    total_countries: totalCountries,
                    total_manufacturers: totalManufacturers,
                    total_models: totalModels,
                    total_trims: totalTrims,
                    total_variants: totalVariants
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

    // Manufacturers list
    app.get('/api/v1/manufacturers', (req, res) => {
        try {
            const country = req.query.country || req.query.country_code || req.query.countryCode;
            const manufacturers = getManufacturers(db, country);
            res.status(200).json({ manufacturers });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Models list
    app.get('/api/v1/models', (req, res) => {
        try {
            const manufacturerId = req.query.manufacturer || req.query.manufacturer_id || req.query.manufacturerId;
            const countryCode = req.query.country || req.query.country_code || req.query.countryCode;
            const bodyType = req.query.body_type || req.query.bodyType;
            const limit = req.query.limit;
            const page = req.query.page;

            const models = getModels(db, { manufacturerId, countryCode, bodyType, limit, page });
            res.status(200).json({ models });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Model generations
    app.get('/api/v1/models/:id/generations', (req, res) => {
        try {
            const generations = getGenerations(db, req.params.id);
            res.status(200).json({ model_id: req.params.id, generations });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Legacy Trims list
    app.get('/api/v1/trims', (req, res) => {
        try {
            const modelId = req.query.model || req.query.model_id || req.query.modelId;
            const countryCode = req.query.country || req.query.country_code || req.query.countryCode;
            const year = req.query.year;
            const onSale = req.query.on_sale !== undefined ? req.query.on_sale : req.query.onSale;
            const limit = req.query.limit;
            const page = req.query.page;

            const trims = getTrims(db, { modelId, countryCode, year, onSale, limit, page });
            res.status(200).json({ trims });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Normalized Vehicles list
    app.get('/api/v1/vehicles', (req, res) => {
        try {
            const modelId = req.query.model || req.query.model_id;
            const limit = Math.max(1, Math.min(Number(req.query.limit) || 100, 500));
            const page = Math.max(1, Number(req.query.page) || 1);
            const offset = (page - 1) * limit;

            let query = 'SELECT id FROM variants';
            const params = [];
            if (modelId) {
                query += ' WHERE LOWER(model_id) = LOWER(?)';
                params.push(modelId);
            }
            query += ' ORDER BY year DESC, canonical_variant_name ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const variantIds = db.prepare(query).all(...params).map(v => v.id);
            const vehicles = variantIds.map(id => getVehicleById(db, id)).filter(Boolean);

            res.status(200).json({ page, limit, vehicles });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Single Vehicle details with full hierarchy & data quality
    app.get('/api/v1/vehicles/:id', (req, res) => {
        try {
            const vehicle = getVehicleById(db, req.params.id);
            if (!vehicle) {
                return res.status(404).json({ error: 'Vehicle not found', id: req.params.id });
            }
            res.status(200).json(vehicle);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/v1/vehicles/:id/specifications', (req, res) => {
        try {
            const vehicle = getVehicleById(db, req.params.id);
            if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
            res.status(200).json({ vehicle_id: req.params.id, specifications: vehicle.specifications });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/v1/vehicles/:id/features', (req, res) => {
        try {
            const vehicle = getVehicleById(db, req.params.id);
            if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
            res.status(200).json({ vehicle_id: req.params.id, features: vehicle.features });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/v1/vehicles/:id/prices', (req, res) => {
        try {
            const vehicle = getVehicleById(db, req.params.id);
            if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
            res.status(200).json({ vehicle_id: req.params.id, prices: vehicle.prices });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Vehicle comparison
    app.get('/api/v1/compare', (req, res) => {
        try {
            const vehicleStr = req.query.vehicles || req.query.ids || '';
            const ids = vehicleStr.split(',').map(s => s.trim()).filter(Boolean);
            const comparison = compareVehicles(db, ids);
            res.status(200).json({ comparison });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Cross-entity vehicle search
    app.get('/api/v1/search', (req, res) => {
        try {
            const q = req.query.q || req.query.query || '';
            const country = req.query.country || req.query.country_code || req.query.countryCode;
            const limit = req.query.limit;
            const page = req.query.page;

            const results = searchVehicles(db, q, country, { limit, page });
            res.status(200).json({
                query: q,
                results
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Data Quality & Review Queue APIs
    app.get('/api/v1/data-quality', (req, res) => {
        try {
            const metrics = getDataQualityMetrics(db);
            res.status(200).json({ metrics });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/v1/data-quality/conflicts', (req, res) => {
        try {
            const conflicts = getDataQualityConflicts(db);
            res.status(200).json({ conflicts });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/v1/data-quality/missing', (req, res) => {
        try {
            const missing = getDataQualityMissing(db);
            res.status(200).json({ missing });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/v1/admin/conflicts/:id/resolve', (req, res) => {
        try {
            const { preferred_value, reason, resolved_by } = req.body || {};
            if (!preferred_value) {
                return res.status(400).json({ error: 'preferred_value is required' });
            }
            const updated = resolveConflict(db, req.params.id, preferred_value, reason || 'Manual Admin Resolution', resolved_by || 'ADMIN');
            res.status(200).json({ status: 'RESOLVED', conflict: updated });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Live CarWale Variant Discovery endpoint
    app.get('/api/v1/discovery/carwale', async (req, res) => {
        try {
            const manufacturer = req.query.manufacturer || 'maruti-suzuki';
            const model = req.query.model || 'swift';
            const { discoverCarWaleVariants } = await import('./pipeline/carwaleDiscovery.js');
            const discoveryResult = await discoverCarWaleVariants(manufacturer, model);
            res.status(200).json(discoveryResult);
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

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found', path: req.path });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    });

    return app;
}
