// ponytail: Weighted average scoring -> Upgrade to Bayesian confidence model if source count > 50 per variant.

export const SOURCE_CONFIDENCE = {
    TIER_1_OFFICIAL: 0.98,
    TIER_2_PUBLICATION: 0.88,
    TIER_3_SECONDARY: 0.60,
    INFERRED: 0.20
};

export function detectFieldConflict(fieldName, observations) {
    if (!observations || observations.length === 0) return null;

    const valueGroups = new Map();
    for (const obs of observations) {
        const valStr = String(obs.value).trim();
        if (!valueGroups.has(valStr)) {
            valueGroups.set(valStr, []);
        }
        valueGroups.get(valStr).push(obs);
    }

    if (valueGroups.size <= 1) {
        // No conflict, single agreement
        const singleVal = observations[0].value;
        const avgConfidence = observations.reduce((acc, o) => acc + (o.confidence || 0.8), 0) / observations.length;
        return {
            hasConflict: false,
            preferredValue: singleVal,
            confidence: Math.min(1.0, avgConfidence + (observations.length > 1 ? 0.05 : 0)),
            observations
        };
    }

    // Disagreement exists
    let highestWeight = -1;
    let preferredValue = null;
    let preferredReason = '';

    const competingValues = [];
    for (const [val, obsList] of valueGroups.entries()) {
        const hasTier1 = obsList.some(o => o.source_type === 'TIER_1_OFFICIAL');
        const count = obsList.length;
        const totalWeight = obsList.reduce((acc, o) => acc + (o.confidence || 0.8), 0);

        competingValues.push({
            value: val,
            sources_count: count,
            has_tier_1: hasTier1,
            total_weight: totalWeight,
            sources: obsList.map(o => o.source_name)
        });

        let currentWeight = totalWeight;
        if (hasTier1) currentWeight += 5.0; // Tier 1 strong priority

        if (currentWeight > highestWeight) {
            highestWeight = currentWeight;
            preferredValue = val;
            preferredReason = hasTier1
                ? 'Selected Tier 1 Official Manufacturer source value'
                : `Selected majority consensus value (${count} sources agree)`;
        }
    }

    return {
        hasConflict: true,
        fieldName,
        preferredValue,
        preferredReason,
        competingValues,
        confidence: 0.85,
        observations
    };
}

export function calculateCompleteness(variant) {
    const specs = variant.specifications || {};
    const features = variant.features || [];
    const prices = variant.prices || [];

    const engineFields = ['displacement_cc', 'max_power_ps', 'max_torque_nm', 'fuel_type', 'transmission_type'];
    const filledEngine = engineFields.filter(f => specs[f] !== undefined && specs[f] !== null).length;
    const engineScore = Math.round((filledEngine / engineFields.length) * 100);

    const dimFields = ['length_mm', 'width_mm', 'height_mm', 'wheelbase_mm', 'ground_clearance_mm', 'boot_space_l', 'fuel_tank_l'];
    const filledDim = dimFields.filter(f => specs[f] !== undefined && specs[f] !== null).length;
    const dimScore = Math.round((filledDim / dimFields.length) * 100);

    const featureScore = features.length > 0 ? Math.min(100, Math.round((features.length / 10) * 100)) : 0;
    const pricingScore = prices.length > 0 && prices[0].ex_showroom_price > 0 ? 100 : 0;
    const sourceScore = variant.observations && variant.observations.length > 0 ? 100 : 80;

    const overall = Math.round(
        engineScore * 0.25 +
        dimScore * 0.20 +
        featureScore * 0.25 +
        pricingScore * 0.15 +
        sourceScore * 0.15
    );

    return {
        variants: 100,
        engine: engineScore,
        dimensions: dimScore,
        features: featureScore,
        pricing: pricingScore,
        sources: sourceScore,
        overall
    };
}
