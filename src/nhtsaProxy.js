// ponytail: NHTSA public vPIC API -> Upgrade to paid automotive data provider (e.g. ChromeData / DataOne) if SLA > 99.9% is required.

/**
 * Normalizes raw response payload from NHTSA vPIC API into a clean, consistent vehicle object.
 * @param {Object} rawNhtsa - Raw response from NHTSA vPIC decodevin endpoint.
 * @returns {Object|null} Normalized vehicle details or null if input is malformed.
 */
export function normalizeNhtsaResponse(rawNhtsa) {
    if (!rawNhtsa || typeof rawNhtsa !== 'object' || !Array.isArray(rawNhtsa.Results)) {
        return null;
    }

    const map = new Map();
    for (const item of rawNhtsa.Results) {
        if (item && item.Variable) {
            const val = typeof item.Value === 'string' ? item.Value.trim() : item.Value;
            map.set(item.Variable, val || null);
        }
    }

    return {
        vin: map.get('VIN') || null,
        manufacturer: map.get('Make') || null,
        model: map.get('Model') || null,
        year: map.get('Model Year') || null,
        trim: map.get('Trim') || map.get('Trim2') || null,
        vehicle_type: map.get('Vehicle Type') || null,
        plant_country: map.get('Plant Country') || null,
        engine_specs: {
            displacement_l: map.get('Displacement (L)') || null,
            cylinders: map.get('Engine Number of Cylinders') || null,
            fuel_type: map.get('Fuel Type - Primary') || null,
            horsepower: map.get('Engine Brake (hp) From') || map.get('Engine Power (kW)') || null
        },
        error_code: map.get('Error Code') || null,
        error_text: map.get('Error Text') || null
    };
}

/**
 * Decodes a VIN using the NHTSA vPIC REST API.
 * @param {string} vin - 3 to 17 character alphanumeric Vehicle Identification Number.
 * @param {Object} [options] - Optional configurations (timeoutMs, fetchFn, baseUrl).
 * @returns {Promise<Object>} Normalized vehicle decoding result.
 */
export async function decodeVin(vin, options = {}) {
    const {
        timeoutMs = 8000,
        fetchFn = globalThis.fetch,
        baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin'
    } = options;

    if (!vin || typeof vin !== 'string' || vin.trim().length === 0) {
        const err = new Error('Invalid VIN: VIN is required');
        err.status = 400;
        throw err;
    }

    const cleanVin = vin.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,17}$/.test(cleanVin)) {
        const err = new Error('Invalid VIN format: Must be 3 to 17 alphanumeric characters');
        err.status = 400;
        throw err;
    }

    const url = `${baseUrl}/${encodeURIComponent(cleanVin)}?format=json`;

    let response;
    try {
        const signal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
            ? AbortSignal.timeout(timeoutMs)
            : undefined;
        response = await fetchFn(url, { signal });
    } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            const timeoutErr = new Error(`NHTSA API request timed out after ${timeoutMs}ms`);
            timeoutErr.status = 504;
            throw timeoutErr;
        }
        const netErr = new Error(`NHTSA API network error: ${err.message}`);
        netErr.status = 502;
        throw netErr;
    }

    if (!response.ok) {
        const httpErr = new Error(`NHTSA API responded with status ${response.status}`);
        httpErr.status = 502;
        throw httpErr;
    }

    let json;
    try {
        json = await response.json();
    } catch (err) {
        const parseErr = new Error('Failed to parse NHTSA API JSON response');
        parseErr.status = 502;
        throw parseErr;
    }

    const normalized = normalizeNhtsaResponse(json);
    if (!normalized) {
        const invalidDataErr = new Error('Invalid response structure received from NHTSA API');
        invalidDataErr.status = 502;
        throw invalidDataErr;
    }

    if (!normalized.vin) {
        normalized.vin = cleanVin;
    }

    return normalized;
}
