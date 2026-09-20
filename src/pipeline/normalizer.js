// ponytail: Regex & map-based normalization -> Upgrade to fuzzy-matching engine if variant alias count > 100,000.

export function normalizeFuel(fuelStr) {
    if (!fuelStr || typeof fuelStr !== 'string') return { fuel_type: 'UNKNOWN', secondary_fuel: null };
    const clean = fuelStr.trim().toUpperCase();

    if (clean.includes('CNG')) {
        return { fuel_type: 'CNG', secondary_fuel: 'PETROL' };
    }
    if (clean.includes('LPG')) {
        return { fuel_type: 'LPG', secondary_fuel: 'PETROL' };
    }
    if (clean.includes('PLUG-IN') || clean.includes('PHEV')) {
        return { fuel_type: 'PHEV', secondary_fuel: 'PETROL' };
    }
    if (clean.includes('STRONG HYBRID') || clean.includes('FULL HYBRID')) {
        return { fuel_type: 'STRONG_HYBRID', secondary_fuel: 'PETROL' };
    }
    if (clean.includes('MILD HYBRID') || clean.includes('SMART HYBRID') || clean.includes('ISG')) {
        return { fuel_type: 'MILD_HYBRID', secondary_fuel: 'PETROL' };
    }
    if (clean.includes('HYBRID')) {
        return { fuel_type: 'HYBRID', secondary_fuel: 'PETROL' };
    }
    if (clean.includes('ELECTRIC') || clean.includes('EV') || clean.includes('BEV')) {
        return { fuel_type: 'ELECTRIC', secondary_fuel: null };
    }
    if (clean.includes('DIESEL')) {
        return { fuel_type: 'DIESEL', secondary_fuel: null };
    }
    if (clean.includes('PETROL') || clean.includes('GASOLINE')) {
        return { fuel_type: 'PETROL', secondary_fuel: null };
    }

    return { fuel_type: clean, secondary_fuel: null };
}

export function normalizeTransmission(transStr) {
    if (!transStr || typeof transStr !== 'string') {
        return { transmission_type: 'MANUAL', gear_count: 5 };
    }
    const clean = transStr.trim().toUpperCase();
    let gearCount = null;

    const gearMatch = clean.match(/(\d+)\s*[- ]*(SPEED|SPD|GEAR)/i);
    if (gearMatch) {
        gearCount = parseInt(gearMatch[1], 10);
    }

    if (clean.includes('DCT') || clean.includes('DCA') || clean.includes('DUAL CLUTCH') || clean.includes('DSG')) {
        return { transmission_type: 'DCT', gear_count: gearCount || 7 };
    }
    if (clean.includes('AMT') || clean.includes('AGS') || clean.includes('AUTOMATED MANUAL')) {
        return { transmission_type: 'AMT', gear_count: gearCount || 5 };
    }
    if (clean.includes('IMT')) {
        return { transmission_type: 'IMT', gear_count: gearCount || 6 };
    }
    if (clean.includes('E-CVT') || clean.includes('ECVT')) {
        return { transmission_type: 'E_CVT', gear_count: null };
    }
    if (clean.includes('CVT') || clean.includes('IVT')) {
        return { transmission_type: 'CVT', gear_count: gearCount || null };
    }
    if (clean.includes('TORQUE CONVERTER') || clean.includes('AT') || clean.includes('AUTOMATIC')) {
        if (clean.includes('SINGLE SPEED') || clean.includes('1-SPEED')) {
            return { transmission_type: 'SINGLE_SPEED', gear_count: 1 };
        }
        return { transmission_type: 'TORQUE_CONVERTER', gear_count: gearCount || 6 };
    }
    if (clean.includes('SINGLE SPEED') || clean.includes('1-SPEED') || clean.includes('FIXED GEAR')) {
        return { transmission_type: 'SINGLE_SPEED', gear_count: 1 };
    }
    if (clean.includes('MANUAL') || clean.includes('MT')) {
        return { transmission_type: 'MANUAL', gear_count: gearCount || 5 };
    }

    return { transmission_type: 'MANUAL', gear_count: gearCount || 5 };
}

export function canonicalizeVariantName(variantName) {
    if (!variantName || typeof variantName !== 'string') return '';

    return variantName
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\s*\+\s*/g, '+')
        .replace(/(\b[A-Z0-9]+)\s*\(\s*O\s*\)/gi, '$1(O)')
        .replace(/(\b[A-Z0-9]+)\s+O\b/gi, '$1(O)');
}

export function parseNumericValue(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/,/g, '').trim();
    const match = str.match(/[-+]?\d*\.?\d+/);
    return match ? parseFloat(match[0]) : null;
}
