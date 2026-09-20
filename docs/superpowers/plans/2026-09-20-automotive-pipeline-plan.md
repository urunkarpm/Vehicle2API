# Automotive Data Collection & Verification Architecture Plan

**Date**: 2026-09-20  
**Target Market**: India (`market = 'IN'`)  
**Scope**: 5 Manufacturers, 25 Models, 150+ Variants with full hierarchical normalized schema, multi-source provenance, conflict resolution, quality scoring, and REST API.

---

## 1. Audit Findings & Gap Analysis

| Component | Current State | Target State |
| :--- | :--- | :--- |
| **Database Schema** | Flat 4-table schema (`countries`, `manufacturers`, `models`, `trims`) | Normalized 16-table schema including `generations`, `facelifts`, `model_years`, `powertrains`, `engines`, `transmissions`, `variants`, `specifications`, `variant_features`, `prices`, `sources`, `source_observations`, `conflicts`, `raw_source_data`, `audit_logs` |
| **Market Context** | Mixed US, UK, DE, JP, IN data without market isolation | Strict `market = 'IN'` isolation as first-class attribute |
| **Source Provenance** | None; values hardcoded without traceability | Every value backed by `source_observations` (Tier 1 official, Tier 2 publication, Tier 3 secondary) with confidence scores (0.00-1.00) |
| **Conflict Management** | Silent overwriting | Automatic conflict detection across competing sources, retaining all observations and flagging for manual/auto review |
| **Data Normalization** | Raw text in `trims` table | Dual storage: `raw_value` + `normalized_value`, canonical variant names (`SX(O)` vs `SX (O)`), normalized units |
| **Data Quality & Completeness** | No scoring or validation | Comprehensive model/variant completeness scores (0-100%) and automated logical validation tests |
| **API Endpoints** | 6 basic endpoints | 18+ endpoints covering hierarchy, specs, features, prices, search, compare, data-quality metrics, conflict resolution queue |

---

## 2. Target Database Schema (SQLite)

```
[Manufacturers] ──▶ [Models] ──▶ [Generations] ──▶ [Facelifts] ──▶ [ModelYears]
                                                                        │
                                                                        ▼
[Engines] ──┐                                                       [Variants]
            ├─▶ [Powertrains] ──────────────────────────────────────────┤
[Transmissions] ┘                                                       │
                                                                        ├──▶ [Specifications]
                                                                        ├──▶ [VariantFeatures]
                                                                        ├──▶ [Prices]
                                                                        ├──▶ [SourceObservations] ──▶ [Sources]
                                                                        └──▶ [Conflicts]
```

---

## 3. Data Pipeline Stages

1. **Discovery & Raw Storage**: Ingest brochure data and web snapshots into `raw_source_data/`.
2. **Parsing & Normalization**: Extract raw key-value pairs; apply canonical variant naming and unit conversions.
3. **Entity Linking**: Bind variants to model years, facelifts, generations, and normalized powertrains.
4. **Multi-Source Cross-Check**: Compare values across Tier 1 (Brochure/Manufacturer), Tier 2 (CarWale/CarDekho/Autocar), and Tier 3.
5. **Conflict Detection**: Compute variance and generate conflict entries when values disagree.
6. **Logical Validation**: Run sanity checks (`power > 0`, `kerb_weight < gross_weight`, `wheelbase < length`, impossible combinations).
7. **Scoring Engine**: Calculate confidence scores (0.0–1.0) and completeness percentages (variants, specs, features, pricing, overall).
8. **Canonical Database Persistence**: Write clean records to normalized tables and update backward-compatible `trims` view/table.

---

## 4. Initial Market Target (25 Models across 5 Top Indian OEMs)

* **Maruti Suzuki**: Swift, Brezza, Grand Vitara, Baleno, Dzire
* **Hyundai India**: Creta, Venue, Verna, i20, Exter
* **Tata Motors**: Nexon, Harrier, Punch, Tiago, Safari
* **Mahindra**: Scorpio-N, XUV700, Thar, XUV3XO, Bolero Neo
* **Toyota India**: Fortuner, Innova Hycross, Urban Cruiser Taisor, Glanza, Camry

---

## 5. Implementation Milestones

- [x] **Phase 1: Architecture Audit & Plan Definition**
- [ ] **Phase 2: Database Schema & Migration Layer** (`src/db.js`)
- [ ] **Phase 3: Source Adapters, Normalization & Pipeline Engine** (`src/pipeline/`)
- [ ] **Phase 4: Multi-Source Dataset Ingestion (25 Models, 150+ Variants)** (`src/data/`)
- [ ] **Phase 5: Automated Quality, Validation & Conflict Resolution** (`src/validation/`)
- [ ] **Phase 6: Comprehensive REST API & Data Review Queue** (`src/app.js`, `src/models.js`)
- [ ] **Phase 7: End-to-End Verification & Test Suite Execution** (`test/`)
