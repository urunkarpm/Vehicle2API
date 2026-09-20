// Comprehensive variant specifications, features, prices, and observations for Indian vehicles

export const indiaVariants = [
    // Hyundai Creta 2024 Facelift
    {
        id: 'hyundai-creta-2024-e-15-petrol',
        model_id: 'hyundai-creta',
        generation_id: 'gen_creta_2',
        facelift_id: 'fl_creta_2024',
        model_year_id: 'my_creta_2024',
        engine_id: 'eng_hyundai_15_mpfi',
        trans_id: 'trans_6mt',
        country_code: 'IN',
        raw_variant_name: 'E 1.5 Petrol MT',
        canonical_variant_name: 'E',
        manufacturer_variant_name: 'Creta E 1.5 MPi',
        year: 2024,
        body_type: 'SUV',
        seating_capacity: 5,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 1099900,
        specs: {
            length_mm: 4330,
            width_mm: 1790,
            height_mm: 1635,
            wheelbase_mm: 2610,
            ground_clearance_mm: 190,
            boot_space_l: 433,
            fuel_tank_l: 50,
            kerb_weight_kg: 1240,
            max_power_ps: 115,
            max_torque_nm: 143.8,
            claimed_mileage_kpl: 17.4
        },
        features: [
            { category: 'Safety', key: 'abs', name: 'ABS with EBD', is_standard: 1 },
            { category: 'Safety', key: 'airbags_6', name: '6 Airbags (Driver, Passenger, Side & Curtain)', is_standard: 1 },
            { category: 'Safety', key: 'esc', name: 'Electronic Stability Control (ESC)', is_standard: 1 },
            { category: 'Safety', key: 'hill_start_assist', name: 'Hill-Start Assist Control (HAC)', is_standard: 1 },
            { category: 'Comfort', key: 'manual_ac', name: 'Manual Air Conditioner', is_standard: 1 },
            { category: 'Comfort', key: 'power_windows', name: 'Front & Rear Power Windows', is_standard: 1 },
            { category: 'Exterior', key: 'projector_headlamps', name: 'Halogen Projector Headlamps', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Hyundai India Official Brochure', source_type: 'TIER_1_OFFICIAL', field: 'ground_clearance', raw: '190 mm', norm: '190', confidence: 0.98 },
            { source_name: 'CarWale Data', source_type: 'TIER_2_PUBLICATION', field: 'ground_clearance', raw: '190 mm', norm: '190', confidence: 0.88 },
            { source_name: 'CarDekho Catalog', source_type: 'TIER_2_PUBLICATION', field: 'ground_clearance', raw: '195 mm', norm: '195', confidence: 0.85 } // Controlled conflict
        ]
    },
    {
        id: 'hyundai-creta-2024-sxo-15-diesel-at',
        model_id: 'hyundai-creta',
        generation_id: 'gen_creta_2',
        facelift_id: 'fl_creta_2024',
        model_year_id: 'my_creta_2024',
        engine_id: 'eng_hyundai_15_crdi',
        trans_id: 'trans_6at',
        country_code: 'IN',
        raw_variant_name: 'SX(O) 1.5 Diesel AT',
        canonical_variant_name: 'SX(O)',
        manufacturer_variant_name: 'Creta SX(O) 1.5 CRDi AT',
        year: 2024,
        body_type: 'SUV',
        seating_capacity: 5,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 1999900,
        specs: {
            length_mm: 4330,
            width_mm: 1790,
            height_mm: 1635,
            wheelbase_mm: 2610,
            ground_clearance_mm: 190,
            boot_space_l: 433,
            fuel_tank_l: 50,
            kerb_weight_kg: 1365,
            max_power_ps: 116,
            max_torque_nm: 250,
            claimed_mileage_kpl: 19.1
        },
        features: [
            { category: 'Safety', key: 'abs', name: 'ABS with EBD', is_standard: 1 },
            { category: 'Safety', key: 'airbags_6', name: '6 Airbags', is_standard: 1 },
            { category: 'Safety', key: 'adas_level2', name: 'Hyundai SmartSense Level 2 ADAS', is_standard: 1 },
            { category: 'Safety', key: 'camera_360', name: '360-Degree Surround View Monitor', is_standard: 1 },
            { category: 'Safety', key: 'blind_spot_monitor', name: 'Blind Spot View Monitor', is_standard: 1 },
            { category: 'Comfort', key: 'panoramic_sunroof', name: 'Voice-enabled Panoramic Sunroof', is_standard: 1 },
            { category: 'Comfort', key: 'ventilated_seats', name: 'Front Ventilated Seats', is_standard: 1 },
            { category: 'Comfort', key: 'powered_driver_seat', name: '8-way Powered Driver Seat', is_standard: 1 },
            { category: 'Comfort', key: 'bose_speakers', name: 'Bose Premium 8-Speaker System', is_standard: 1 },
            { category: 'Comfort', key: 'climate_control_dual', name: 'Dual Zone Automatic Climate Control', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Hyundai India Official Brochure', source_type: 'TIER_1_OFFICIAL', field: 'ex_showroom_price', raw: '19,99,900 INR', norm: '1999900', confidence: 0.99 },
            { source_name: 'Autocar India Specification Sheet', source_type: 'TIER_2_PUBLICATION', field: 'ex_showroom_price', raw: '₹19.99 Lakh', norm: '1999900', confidence: 0.90 }
        ]
    },

    // Tata Nexon 2024
    {
        id: 'tata-nexon-2024-smart-12-petrol',
        model_id: 'tata-nexon',
        generation_id: 'gen_nexon_2',
        facelift_id: 'fl_nexon_2023',
        model_year_id: 'my_nexon_2024',
        engine_id: 'eng_tata_12_revotron',
        trans_id: 'trans_5mt',
        country_code: 'IN',
        raw_variant_name: 'Smart 1.2 Revotron MT',
        canonical_variant_name: 'Smart',
        manufacturer_variant_name: 'Nexon Smart Petrol',
        year: 2024,
        body_type: 'SUV',
        seating_capacity: 5,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 799990,
        specs: {
            length_mm: 3995,
            width_mm: 1804,
            height_mm: 1620,
            wheelbase_mm: 2498,
            ground_clearance_mm: 208,
            boot_space_l: 382,
            fuel_tank_l: 44,
            kerb_weight_kg: 1188,
            max_power_ps: 120,
            max_torque_nm: 170,
            claimed_mileage_kpl: 17.44
        },
        features: [
            { category: 'Safety', key: 'abs', name: 'ABS with EBD', is_standard: 1 },
            { category: 'Safety', key: 'airbags_6', name: '6 Airbags (Standard across trims)', is_standard: 1 },
            { category: 'Safety', key: 'esp', name: 'Electronic Stability Program (ESP)', is_standard: 1 },
            { category: 'Safety', key: 'isofix', name: 'ISOFIX Child Seat Mounts', is_standard: 1 },
            { category: 'Comfort', key: 'led_headlamps', name: 'LED Headlamps & DRLs', is_standard: 1 },
            { category: 'Comfort', key: 'digital_cluster', name: 'Digital Instrument Cluster', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Tata Motors Official Press Kit', source_type: 'TIER_1_OFFICIAL', field: 'airbags', raw: '6 Airbags Standard', norm: '6', confidence: 0.99 },
            { source_name: 'CarWale Listing', source_type: 'TIER_2_PUBLICATION', field: 'airbags', raw: '6 Airbags', norm: '6', confidence: 0.90 }
        ]
    },
    {
        id: 'tata-nexon-2024-ev-empowered-lr',
        model_id: 'tata-nexon',
        generation_id: 'gen_nexon_2',
        facelift_id: 'fl_nexon_2023',
        model_year_id: 'my_nexon_2024',
        engine_id: 'eng_tata_nexon_ev_lr',
        trans_id: 'trans_single_ev',
        country_code: 'IN',
        raw_variant_name: 'EV Empowered+ Long Range',
        canonical_variant_name: 'EV Empowered+ LR',
        manufacturer_variant_name: 'Nexon.ev Empowered+ LR',
        year: 2024,
        body_type: 'EV',
        seating_capacity: 5,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 1929000,
        specs: {
            length_mm: 3994,
            width_mm: 1811,
            height_mm: 1616,
            wheelbase_mm: 2498,
            ground_clearance_mm: 190,
            boot_space_l: 350,
            battery_capacity_kwh: 40.5,
            ev_range_km: 465,
            kerb_weight_kg: 1440,
            max_power_ps: 145,
            max_torque_nm: 215
        },
        features: [
            { category: 'Safety', key: 'abs', name: 'ABS with EBD', is_standard: 1 },
            { category: 'Safety', key: 'airbags_6', name: '6 Airbags', is_standard: 1 },
            { category: 'Safety', key: 'camera_360', name: '360 Surround Camera', is_standard: 1 },
            { category: 'Comfort', key: 'screen_12_3', name: '12.3-inch Cinematic Touchscreen by HARMAN', is_standard: 1 },
            { category: 'Comfort', key: 'arcade_ev', name: 'Arcade.ev App Suite with V2L & V2V Charging', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Tata.ev Official Site', source_type: 'TIER_1_OFFICIAL', field: 'battery_capacity_kwh', raw: '40.5 kWh', norm: '40.5', confidence: 0.99 }
        ]
    },

    // Maruti Suzuki Swift 2024
    {
        id: 'maruti-swift-2024-zxi-plus-amt',
        model_id: 'maruti-suzuki-swift',
        generation_id: 'gen_swift_4',
        facelift_id: null,
        model_year_id: 'my_swift_2024',
        engine_id: 'eng_maruti_z12e',
        trans_id: 'trans_amt_5',
        country_code: 'IN',
        raw_variant_name: 'ZXi+ Dual Tone AGS',
        canonical_variant_name: 'ZXi+',
        manufacturer_variant_name: 'Swift ZXi+ AGS',
        year: 2024,
        body_type: 'Hatchback',
        seating_capacity: 5,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 964500,
        specs: {
            length_mm: 3860,
            width_mm: 1735,
            height_mm: 1520,
            wheelbase_mm: 2450,
            ground_clearance_mm: 163,
            boot_space_l: 265,
            fuel_tank_l: 37,
            kerb_weight_kg: 920,
            max_power_ps: 82,
            max_torque_nm: 112,
            claimed_mileage_kpl: 25.75
        },
        features: [
            { category: 'Safety', key: 'airbags_6', name: '6 Airbags', is_standard: 1 },
            { category: 'Safety', key: 'esp', name: 'Electronic Stability Program (ESP)', is_standard: 1 },
            { category: 'Safety', key: 'hill_hold', name: 'Hill Hold Assist', is_standard: 1 },
            { category: 'Comfort', key: 'screen_9_inch', name: '9-inch SmartPlay Pro+ Touchscreen', is_standard: 1 },
            { category: 'Comfort', key: 'wireless_charger', name: 'Wireless Phone Charger', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Maruti Suzuki Official Brochure', source_type: 'TIER_1_OFFICIAL', field: 'claimed_mileage_kpl', raw: '25.75 km/l', norm: '25.75', confidence: 0.98 },
            { source_name: 'Team-BHP Review', source_type: 'TIER_2_PUBLICATION', field: 'claimed_mileage_kpl', raw: '25.75 km/l', norm: '25.75', confidence: 0.88 }
        ]
    },

    // Mahindra XUV700 2024
    {
        id: 'mahindra-xuv700-ax7l-awd-at',
        model_id: 'mahindra-xuv700',
        generation_id: 'gen_xuv700_1',
        facelift_id: null,
        model_year_id: null,
        engine_id: 'eng_mahindra_mhawk_22',
        trans_id: 'trans_6at_awd',
        country_code: 'IN',
        raw_variant_name: 'AX7 Luxury Pack Diesel AT AWD 7-Str',
        canonical_variant_name: 'AX7L AWD',
        manufacturer_variant_name: 'XUV700 AX7L Diesel AWD',
        year: 2024,
        body_type: 'SUV',
        seating_capacity: 7,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 2699000,
        specs: {
            length_mm: 4695,
            width_mm: 1890,
            height_mm: 1755,
            wheelbase_mm: 2750,
            ground_clearance_mm: 200,
            boot_space_l: 240,
            fuel_tank_l: 60,
            kerb_weight_kg: 1960,
            max_power_ps: 185,
            max_torque_nm: 450,
            claimed_mileage_kpl: 16.6
        },
        features: [
            { category: 'Safety', key: 'adas_level2', name: 'Advanced Driver Assistance Systems (ADAS)', is_standard: 1 },
            { category: 'Safety', key: 'airbags_7', name: '7 Airbags (including knee airbag)', is_standard: 1 },
            { category: 'Safety', key: 'camera_360', name: '360 View Camera', is_standard: 1 },
            { category: 'Comfort', key: 'sony_audio_12', name: '12-Speaker Sony 3D Immersive Audio', is_standard: 1 },
            { category: 'Comfort', key: 'skyroof', name: 'Panoramic Skyroof', is_standard: 1 },
            { category: 'Comfort', key: 'ventilated_seats', name: 'First-in-Segment Front Ventilated Seats', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Mahindra Auto Official Price List', source_type: 'TIER_1_OFFICIAL', field: 'ex_showroom_price', raw: '26,99,000 INR', norm: '2699000', confidence: 0.99 }
        ]
    },

    // Toyota Fortuner Legender 2024
    {
        id: 'toyota-fortuner-legender-4x4-at',
        model_id: 'toyota-fortuner',
        generation_id: 'gen_fortuner_2',
        facelift_id: null,
        model_year_id: null,
        engine_id: 'eng_toyota_28_gd',
        trans_id: 'trans_6at_4wd',
        country_code: 'IN',
        raw_variant_name: 'Legender 2.8 4x4 AT',
        canonical_variant_name: 'Legender 4x4',
        manufacturer_variant_name: 'Fortuner Legender 4x4 AT',
        year: 2024,
        body_type: 'SUV',
        seating_capacity: 7,
        doors: 5,
        status: 'ACTIVE',
        ex_showroom_price: 4764000,
        specs: {
            length_mm: 4795,
            width_mm: 1855,
            height_mm: 1835,
            wheelbase_mm: 2745,
            ground_clearance_mm: 225,
            boot_space_l: 296,
            fuel_tank_l: 80,
            kerb_weight_kg: 2180,
            max_power_ps: 204,
            max_torque_nm: 500,
            claimed_mileage_kpl: 14.2
        },
        features: [
            { category: 'Safety', key: 'airbags_7', name: '7 SRS Airbags', is_standard: 1 },
            { category: 'Safety', key: 'vsc', name: 'Vehicle Stability Control with Brake Assist', is_standard: 1 },
            { category: 'Comfort', key: 'powered_tailgate', name: 'Hands-free Power Back Door with Kick Sensor', is_standard: 1 },
            { category: 'Comfort', key: 'jbl_audio_11', name: '11-Speaker JBL Premium Audio', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Toyota Kirloskar Motor Official Brochure', source_type: 'TIER_1_OFFICIAL', field: 'max_torque_nm', raw: '500 Nm', norm: '500', confidence: 0.99 }
        ]
    },

    // Historical / Discontinued Model Example (Requirement 22)
    {
        id: 'discontinued-maruti-swift-13-ddis-diesel',
        model_id: 'maruti-suzuki-swift',
        generation_id: null,
        facelift_id: null,
        model_year_id: null,
        engine_id: 'eng_maruti_13_ddis',
        trans_id: 'trans_5mt',
        country_code: 'IN',
        raw_variant_name: 'ZDi 1.3 DDiS Diesel',
        canonical_variant_name: 'ZDi',
        manufacturer_variant_name: 'Swift ZDi 1.3 DDiS',
        year: 2018,
        body_type: 'Hatchback',
        seating_capacity: 5,
        doors: 5,
        status: 'DISCONTINUED',
        available_from: '2018-02-01',
        available_until: '2020-03-31',
        ex_showroom_price: 796000,
        specs: {
            length_mm: 3840,
            width_mm: 1735,
            height_mm: 1530,
            wheelbase_mm: 2450,
            ground_clearance_mm: 163,
            boot_space_l: 268,
            fuel_tank_l: 37,
            kerb_weight_kg: 985,
            max_power_ps: 75,
            max_torque_nm: 190,
            claimed_mileage_kpl: 28.4
        },
        features: [
            { category: 'Safety', key: 'abs', name: 'ABS with EBD', is_standard: 1 },
            { category: 'Safety', key: 'airbags_2', name: 'Dual Front Airbags', is_standard: 1 }
        ],
        observations: [
            { source_name: 'Maruti Suzuki Historical Archives 2018', source_type: 'TIER_1_OFFICIAL', field: 'status', raw: 'DISCONTINUED BS4 Model', norm: 'DISCONTINUED', confidence: 0.95 }
        ]
    }
];
