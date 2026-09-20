// ponytail: Rule-based validation engine -> Upgrade to configurable JSON-schema validator for custom OEM rules.

export function validateVehicleRecord(record) {
    const errors = [];
    const warnings = [];

    // Required fields check
    const requiredFields = ['manufacturer', 'model', 'variant', 'fuel_type', 'transmission_type', 'market'];
    for (const field of requiredFields) {
        if (!record[field]) {
            errors.push({ field, rule: 'REQUIRED_FIELD', message: `Missing required field: ${field}` });
        }
    }

    if (record.market && record.market.toUpperCase() !== 'IN') {
        warnings.push({ field: 'market', rule: 'MARKET_MISMATCH', message: `Market is ${record.market}, expected IN` });
    }

    const {
        power_ps,
        torque_nm,
        displacement_cc,
        length_mm,
        width_mm,
        height_mm,
        wheelbase_mm,
        fuel_tank_l,
        battery_capacity_kwh,
        fuel_type,
        transmission_type,
        cylinders
    } = record;

    // Logical validation
    if (power_ps !== undefined && power_ps !== null && power_ps <= 0) {
        errors.push({ field: 'power_ps', rule: 'LOGICAL_RANGE', message: 'Power must be greater than 0' });
    }
    if (torque_nm !== undefined && torque_nm !== null && torque_nm <= 0) {
        errors.push({ field: 'torque_nm', rule: 'LOGICAL_RANGE', message: 'Torque must be greater than 0' });
    }

    if (fuel_type !== 'ELECTRIC' && displacement_cc !== undefined && displacement_cc !== null && displacement_cc <= 0) {
        errors.push({ field: 'displacement_cc', rule: 'LOGICAL_RANGE', message: 'Engine displacement must be greater than 0 for non-EVs' });
    }

    if (length_mm && wheelbase_mm && wheelbase_mm >= length_mm) {
        errors.push({ field: 'wheelbase_mm', rule: 'DIMENSION_SANITY', message: `Wheelbase (${wheelbase_mm}mm) cannot be >= length (${length_mm}mm)` });
    }
    if (length_mm && width_mm && width_mm >= length_mm) {
        errors.push({ field: 'width_mm', rule: 'DIMENSION_SANITY', message: `Width (${width_mm}mm) cannot be >= length (${length_mm}mm)` });
    }
    if (length_mm && height_mm && height_mm >= length_mm) {
        errors.push({ field: 'height_mm', rule: 'DIMENSION_SANITY', message: `Height (${height_mm}mm) cannot be >= length (${length_mm}mm)` });
    }

    if (fuel_type !== 'ELECTRIC' && fuel_tank_l !== undefined && fuel_tank_l !== null && fuel_tank_l <= 0) {
        errors.push({ field: 'fuel_tank_l', rule: 'ICE_FUEL_TANK', message: 'ICE vehicles must have fuel_tank_l > 0' });
    }
    if (fuel_type === 'ELECTRIC' && battery_capacity_kwh !== undefined && battery_capacity_kwh !== null && battery_capacity_kwh <= 0) {
        errors.push({ field: 'battery_capacity_kwh', rule: 'EV_BATTERY', message: 'EVs must have battery_capacity_kwh > 0' });
    }

    // Impossible combinations
    if (fuel_type === 'ELECTRIC' && fuel_tank_l && fuel_tank_l > 0) {
        errors.push({ field: 'impossible_combination', rule: 'EV_WITH_FUEL_TANK', message: `EV record specifies fuel tank capacity of ${fuel_tank_l}L` });
    }

    if (fuel_type === 'CNG' && record.engine_fuel === 'DIESEL') {
        errors.push({ field: 'impossible_combination', rule: 'CNG_DIESEL', message: 'CNG is not available with Diesel engine' });
    }

    if (cylinders === 3 && displacement_cc && displacement_cc > 3500) {
        errors.push({ field: 'impossible_combination', rule: 'CYLINDER_DISPLACEMENT_MISMATCH', message: `3-cylinder engine with unusual ${displacement_cc}cc displacement` });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
