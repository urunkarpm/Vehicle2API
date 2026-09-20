// ponytail: In-memory source adapter layer -> Upgrade to asynchronous scraping workers if real-time web scraping queue is needed.

export class BaseSourceAdapter {
    constructor(sourceId, name, sourceType, publisher, url = '') {
        this.sourceId = sourceId;
        this.name = name;
        this.sourceType = sourceType; // TIER_1_OFFICIAL, TIER_2_PUBLICATION, TIER_3_SECONDARY
        this.publisher = publisher;
        this.url = url;
    }

    createObservation(variantId, fieldName, rawValue, normalizedValue, confidence) {
        return {
            id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            variant_id: variantId,
            field_name: fieldName,
            raw_value: String(rawValue),
            normalized_value: normalizedValue !== null ? String(normalizedValue) : String(rawValue),
            source_id: this.sourceId,
            confidence,
            retrieved_at: new Date().toISOString()
        };
    }
}

export class ManufacturerOfficialAdapter extends BaseSourceAdapter {
    constructor(publisher, url) {
        super(`src_mfr_${publisher.toLowerCase().replace(/\s+/g, '_')}`, `${publisher} Official Brochure & Specs`, 'TIER_1_OFFICIAL', publisher, url);
    }
}

export class CarWaleAdapter extends BaseSourceAdapter {
    constructor() {
        super('src_carwale', 'CarWale Automotive Database', 'TIER_2_PUBLICATION', 'CarWale', 'https://www.carwale.com');
    }
}

export class CarDekhoAdapter extends BaseSourceAdapter {
    constructor() {
        super('src_cardekho', 'CarDekho Vehicle Catalog', 'TIER_2_PUBLICATION', 'CarDekho', 'https://www.cardekho.com');
    }
}

export class AutocarIndiaAdapter extends BaseSourceAdapter {
    constructor() {
        super('src_autocar', 'Autocar India Data & Specs', 'TIER_2_PUBLICATION', 'Autocar India', 'https://www.autocarindia.com');
    }
}
