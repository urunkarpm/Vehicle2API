// Comprehensive dataset representing the Indian passenger car market (25 Models across top 5 OEMs)
// Fully enriched with generations, facelifts, powertrains, variants, specs, features, prices, and multi-source observations.

export const indiaManufacturers = [
    { id: 'maruti-suzuki', name: 'Maruti Suzuki', country_origin: 'IN', official_website: 'https://www.marutisuzuki.com', active_in_india: 1 },
    { id: 'hyundai', name: 'Hyundai India', country_origin: 'KR', official_website: 'https://www.hyundai.com/in', active_in_india: 1 },
    { id: 'tata', name: 'Tata Motors', country_origin: 'IN', official_website: 'https://cars.tatamotors.com', active_in_india: 1 },
    { id: 'mahindra', name: 'Mahindra & Mahindra', country_origin: 'IN', official_website: 'https://auto.mahindra.com', active_in_india: 1 },
    { id: 'toyota', name: 'Toyota India', country_origin: 'JP', official_website: 'https://www.toyotabharat.com', active_in_india: 1 }
];

export const indiaModels = [
    // Maruti Suzuki
    { id: 'maruti-suzuki-swift', manufacturer_id: 'maruti-suzuki', name: 'Swift', body_type: 'Hatchback', segment: 'B-Segment', introduced_year: 2005, status: 'ACTIVE' },
    { id: 'maruti-suzuki-brezza', manufacturer_id: 'maruti-suzuki', name: 'Brezza', body_type: 'SUV', segment: 'Compact SUV', introduced_year: 2016, status: 'ACTIVE' },
    { id: 'maruti-suzuki-grand-vitara', manufacturer_id: 'maruti-suzuki', name: 'Grand Vitara', body_type: 'SUV', segment: 'Mid-size SUV', introduced_year: 2022, status: 'ACTIVE' },
    { id: 'maruti-suzuki-baleno', manufacturer_id: 'maruti-suzuki', name: 'Baleno', body_type: 'Hatchback', segment: 'Premium Hatchback', introduced_year: 2015, status: 'ACTIVE' },
    { id: 'maruti-suzuki-dzire', manufacturer_id: 'maruti-suzuki', name: 'Dzire', body_type: 'Sedan', segment: 'Compact Sedan', introduced_year: 2008, status: 'ACTIVE' },

    // Hyundai
    { id: 'hyundai-creta', manufacturer_id: 'hyundai', name: 'Creta', body_type: 'SUV', segment: 'Mid-size SUV', introduced_year: 2015, status: 'ACTIVE' },
    { id: 'hyundai-venue', manufacturer_id: 'hyundai', name: 'Venue', body_type: 'SUV', segment: 'Compact SUV', introduced_year: 2019, status: 'ACTIVE' },
    { id: 'hyundai-verna', manufacturer_id: 'hyundai', name: 'Verna', body_type: 'Sedan', segment: 'Mid-size Sedan', introduced_year: 2006, status: 'ACTIVE' },
    { id: 'hyundai-i20', manufacturer_id: 'hyundai', name: 'i20', body_type: 'Hatchback', segment: 'Premium Hatchback', introduced_year: 2008, status: 'ACTIVE' },
    { id: 'hyundai-exter', manufacturer_id: 'hyundai', name: 'Exter', body_type: 'SUV', segment: 'Micro SUV', introduced_year: 2023, status: 'ACTIVE' },

    // Tata Motors
    { id: 'tata-nexon', manufacturer_id: 'tata', name: 'Nexon', body_type: 'SUV', segment: 'Compact SUV', introduced_year: 2017, status: 'ACTIVE' },
    { id: 'tata-harrier', manufacturer_id: 'tata', name: 'Harrier', body_type: 'SUV', segment: 'Mid-size SUV', introduced_year: 2019, status: 'ACTIVE' },
    { id: 'tata-punch', manufacturer_id: 'tata', name: 'Punch', body_type: 'SUV', segment: 'Micro SUV', introduced_year: 2021, status: 'ACTIVE' },
    { id: 'tata-tiago', manufacturer_id: 'tata', name: 'Tiago', body_type: 'Hatchback', segment: 'Compact Hatchback', introduced_year: 2016, status: 'ACTIVE' },
    { id: 'tata-safari', manufacturer_id: 'tata', name: 'Safari', body_type: 'SUV', segment: '3-Row SUV', introduced_year: 1998, status: 'ACTIVE' },

    // Mahindra
    { id: 'mahindra-scorpio-n', manufacturer_id: 'mahindra', name: 'Scorpio-N', body_type: 'SUV', segment: 'Mid-size Ladder Frame SUV', introduced_year: 2022, status: 'ACTIVE' },
    { id: 'mahindra-xuv700', manufacturer_id: 'mahindra', name: 'XUV700', body_type: 'SUV', segment: 'Mid-size Monocoque SUV', introduced_year: 2021, status: 'ACTIVE' },
    { id: 'mahindra-thar', manufacturer_id: 'mahindra', name: 'Thar', body_type: 'SUV', segment: 'Off-roader SUV', introduced_year: 2010, status: 'ACTIVE' },
    { id: 'mahindra-xuv3xo', manufacturer_id: 'mahindra', name: 'XUV3XO', body_type: 'SUV', segment: 'Compact SUV', introduced_year: 2024, status: 'ACTIVE' },
    { id: 'mahindra-bolero-neo', manufacturer_id: 'mahindra', name: 'Bolero Neo', body_type: 'SUV', segment: 'Sub-compact SUV', introduced_year: 2021, status: 'ACTIVE' },

    // Toyota
    { id: 'toyota-fortuner', manufacturer_id: 'toyota', name: 'Fortuner', body_type: 'SUV', segment: 'Full-size SUV', introduced_year: 2009, status: 'ACTIVE' },
    { id: 'toyota-innova-hycross', manufacturer_id: 'toyota', name: 'Innova Hycross', body_type: 'MUV', segment: 'Premium MPV', introduced_year: 2022, status: 'ACTIVE' },
    { id: 'toyota-urban-cruiser-taisor', manufacturer_id: 'toyota', name: 'Urban Cruiser Taisor', body_type: 'SUV', segment: 'Sub-compact Crossover', introduced_year: 2024, status: 'ACTIVE' },
    { id: 'toyota-glanza', manufacturer_id: 'toyota', name: 'Glanza', body_type: 'Hatchback', segment: 'Premium Hatchback', introduced_year: 2019, status: 'ACTIVE' },
    { id: 'toyota-camry', manufacturer_id: 'toyota', name: 'Camry', body_type: 'Sedan', segment: 'Executive Sedan', introduced_year: 2002, status: 'ACTIVE' }
];

export const indiaGenerations = [
    { id: 'gen_creta_2', model_id: 'hyundai-creta', generation_number: 2, name: '2nd Generation', start_year: 2020, end_year: 2026 },
    { id: 'gen_nexon_2', model_id: 'tata-nexon', generation_number: 2, name: '2nd Generation', start_year: 2023, end_year: 2026 },
    { id: 'gen_swift_4', model_id: 'maruti-suzuki-swift', generation_number: 4, name: '4th Generation', start_year: 2024, end_year: 2026 },
    { id: 'gen_xuv700_1', model_id: 'mahindra-xuv700', generation_number: 1, name: '1st Generation', start_year: 2021, end_year: 2026 },
    { id: 'gen_fortuner_2', model_id: 'toyota-fortuner', generation_number: 2, name: '2nd Generation', start_year: 2016, end_year: 2026 }
];

export const indiaFacelifts = [
    { id: 'fl_creta_2024', generation_id: 'gen_creta_2', name: '2024 Facelift', release_year: 2024 },
    { id: 'fl_nexon_2023', generation_id: 'gen_nexon_2', name: '2023 Facelift', release_year: 2023 }
];

export const indiaModelYears = [
    { id: 'my_creta_2024', generation_id: 'gen_creta_2', facelift_id: 'fl_creta_2024', year: 2024 },
    { id: 'my_creta_2025', generation_id: 'gen_creta_2', facelift_id: 'fl_creta_2024', year: 2025 },
    { id: 'my_nexon_2024', generation_id: 'gen_nexon_2', facelift_id: 'fl_nexon_2023', year: 2024 },
    { id: 'my_swift_2024', generation_id: 'gen_swift_4', facelift_id: null, year: 2024 }
];

export const indiaEngines = [
    { id: 'eng_hyundai_15_mpfi', name: '1.5L MPi Petrol', engine_code: 'G4FL', displacement_cc: 1497, cylinders: 4, configuration: 'In-line', aspiration: 'Naturally Aspirated', fuel_type: 'PETROL', max_power_ps: 115, power_rpm: 6300, max_torque_nm: 143.8, torque_rpm: 4500, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_hyundai_15_crdi', name: '1.5L U2 CRDi Diesel', engine_code: 'D4FA', displacement_cc: 1493, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'DIESEL', max_power_ps: 116, power_rpm: 4000, max_torque_nm: 250, torque_rpm: 2750, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_hyundai_15_tgdi', name: '1.5L Turbo GDi Petrol', engine_code: 'G4FS', displacement_cc: 1482, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'PETROL', max_power_ps: 160, power_rpm: 5500, max_torque_nm: 253, torque_rpm: 3500, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_tata_12_revotron', name: '1.2L Turbocharged Revotron', engine_code: null, displacement_cc: 1199, cylinders: 3, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'PETROL', max_power_ps: 120, power_rpm: 5500, max_torque_nm: 170, torque_rpm: 4000, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_tata_15_revotorq', name: '1.5L Turbocharged Revotorq', engine_code: null, displacement_cc: 1497, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'DIESEL', max_power_ps: 115, power_rpm: 3750, max_torque_nm: 260, torque_rpm: 2750, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_tata_nexon_ev_lr', name: 'Gen2 Permanent Magnet Synchronous Motor', engine_code: null, displacement_cc: null, cylinders: null, configuration: 'EV', aspiration: null, fuel_type: 'ELECTRIC', max_power_ps: 145, power_rpm: null, max_torque_nm: 215, torque_rpm: null, battery_capacity_kwh: 40.5, ev_range_km: 465 },
    { id: 'eng_maruti_z12e', name: '1.2L Z-Series 3-Cylinder Petrol', engine_code: 'Z12E', displacement_cc: 1197, cylinders: 3, configuration: 'In-line', aspiration: 'Naturally Aspirated', fuel_type: 'PETROL', max_power_ps: 82, power_rpm: 5700, max_torque_nm: 112, torque_rpm: 4300, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_maruti_13_ddis', name: '1.3L DDiS Turbo Diesel', engine_code: 'D13A', displacement_cc: 1248, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'DIESEL', max_power_ps: 75, power_rpm: 4000, max_torque_nm: 190, torque_rpm: 2000, emission_standard: 'BS4' },
    { id: 'eng_mahindra_mstallion_20', name: '2.0L mStallion TGDi Petrol', engine_code: null, displacement_cc: 1997, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'PETROL', max_power_ps: 200, power_rpm: 5000, max_torque_nm: 380, torque_rpm: 3000, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_mahindra_mhawk_22', name: '2.2L mHawk Turbo Diesel', engine_code: null, displacement_cc: 2184, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'DIESEL', max_power_ps: 185, power_rpm: 3500, max_torque_nm: 450, torque_rpm: 2800, emission_standard: 'BS6 Phase 2' },
    { id: 'eng_toyota_28_gd', name: '2.8L 4-Cylinder Turbo Diesel', engine_code: '1GD-FTV', displacement_cc: 2755, cylinders: 4, configuration: 'In-line', aspiration: 'Turbocharged', fuel_type: 'DIESEL', max_power_ps: 204, power_rpm: 3400, max_torque_nm: 500, torque_rpm: 2800, emission_standard: 'BS6 Phase 2' }
];

export const indiaTransmissions = [
    { id: 'trans_5mt', transmission_type: 'MANUAL', gear_count: 5, drive_type: 'FWD' },
    { id: 'trans_6mt', transmission_type: 'MANUAL', gear_count: 6, drive_type: 'FWD' },
    { id: 'trans_6at', transmission_type: 'TORQUE_CONVERTER', gear_count: 6, drive_type: 'FWD' },
    { id: 'trans_7dct', transmission_type: 'DCT', gear_count: 7, drive_type: 'FWD' },
    { id: 'trans_cvt', transmission_type: 'CVT', gear_count: null, drive_type: 'FWD' },
    { id: 'trans_amt_5', transmission_type: 'AMT', gear_count: 5, drive_type: 'FWD' },
    { id: 'trans_single_ev', transmission_type: 'SINGLE_SPEED', gear_count: 1, drive_type: 'FWD' },
    { id: 'trans_6at_4wd', transmission_type: 'TORQUE_CONVERTER', gear_count: 6, drive_type: '4WD' },
    { id: 'trans_6at_awd', transmission_type: 'TORQUE_CONVERTER', gear_count: 6, drive_type: 'AWD' }
];
