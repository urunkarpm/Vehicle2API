import { CarWaleAdapter } from './sourceAdapters.js';

// ponytail: CarWale live variant scraper -> Upgrade to headless browser scraper (Playwright/Puppeteer) if CarWale JS hydration blocks HTML parsing.

export async function discoverCarWaleVariants(manufacturerSlug, modelSlug) {
    const adapter = new CarWaleAdapter();
    const targetUrl = `https://www.carwale.com/${manufacturerSlug}-cars/${modelSlug}/`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, label: CarWaleDiscoveryAdapter)'
            }
        });

        if (!response.ok) {
            throw new Error(`CarWale returned status ${response.status}`);
        }

        const html = await response.text();

        // Extract JSON-LD payload containing Schema.org Car & Offer details
        const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
        const discoveredVariants = [];

        if (jsonLdMatch) {
            for (const match of jsonLdMatch) {
                const jsonStr = match.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
                try {
                    const parsed = JSON.parse(jsonStr);
                    const graph = parsed['@graph'] || (Array.isArray(parsed) ? parsed : [parsed]);

                    for (const item of graph) {
                        if (item['@type'] === 'Car' || item['@type'] === 'Vehicle') {
                            discoveredVariants.push({
                                model_name: item.name || item.model,
                                brand: typeof item.brand === 'object' ? item.brand.name : item.brand,
                                description: item.description,
                                engine_cc: item.vehicleEngine ? item.vehicleEngine[0]?.name : null,
                                fuel_types: item.fuelType ? item.fuelType.map(f => f.name) : [],
                                transmissions: item.vehicleTransmission ? item.vehicleTransmission.map(t => t.name) : [],
                                seating_capacity: item.vehicleSeatingCapacity,
                                ground_clearance_mm: item.groundClearance,
                                source: adapter.name
                            });
                        }
                    }
                } catch (e) {
                    // Ignore malformed JSON-LD block
                }
            }
        }

        return {
            url: targetUrl,
            manufacturer: manufacturerSlug,
            model: modelSlug,
            discovered_variants_count: discoveredVariants.length,
            variants: discoveredVariants
        };
    } catch (err) {
        return {
            url: targetUrl,
            error: err.message,
            variants: []
        };
    }
}
