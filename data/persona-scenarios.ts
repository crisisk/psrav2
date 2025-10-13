export interface PersonaMaterial {
  hsCode: string;
  origin: string;
  value: number;
  percentage: number;
  description?: string;
}

export interface PersonaScenarioInsight {
  summary: string;
  validationNotes: string[];
  followUpActions: string[];
}

export interface PersonaScenario {
  id: string;
  name: string;
  role: string;
  objective: string;
  hsCode: string;
  productSku: string;
  agreement: string;
  productValue: number;
  materials: PersonaMaterial[];
  manufacturingProcesses: string[];
  successCriteria: string[];
  riskFocus: string[];
  insights: PersonaScenarioInsight;
}

export const personaScenarios: PersonaScenario[] = [
  {
    id: "persona-import-specialist",
    name: "Ingrid Bauer",
    role: "Import Specialist, EU Plant",
    objective: "Validate polymer compliance for CETA fast-track clearance.",
    hsCode: "390110",
    productSku: "POLY-INGRID-01",
    agreement: "CETA",
    productValue: 5200,
    materials: [
      { hsCode: "271019", origin: "CA", value: 1500, percentage: 28.8, description: "Petroleum feedstock" },
      { hsCode: "290211", origin: "EU", value: 1100, percentage: 21.2, description: "Propylene" },
      { hsCode: "381230", origin: "US", value: 650, percentage: 12.5, description: "Polymerisation catalyst" },
      { hsCode: "390110", origin: "CA", value: 1950, percentage: 37.5, description: "Recycled polyethylene regrind" }
    ],
    manufacturingProcesses: ["Polymerisation", "Compounding", "Pelletizing"],
    successCriteria: [
      "Non-originating material share stays below 40%",
      "Tariff shift confirmed for feedstock inputs",
      "Confidence score exceeds 85% for audit readiness"
    ],
    riskFocus: [
      "Supplier certificates expiring next quarter",
      "Catalyst origin treated as non-originating in baseline scenario"
    ],
    insights: {
      summary: "Value rule passes with comfortable headroom while heading change supports customs narrative.",
      validationNotes: [
        "System flags expiring certificates and prompts documentation refresh.",
        "Confidence calculation aligns with finance expectations (>0.9)."
      ],
      followUpActions: [
        "Schedule automated reminder for supplier certificate renewal.",
        "Publish audit-ready calculation snapshot to shared workspace."
      ]
    }
  },
  {
    id: "persona-customs-manager",
    name: "Malik Harrison",
    role: "Customs Manager, UK Distribution Hub",
    objective: "Secure preferential duty for smart power converters under EU-UK TCA.",
    hsCode: "850440",
    productSku: "POWER-UK-CTRL",
    agreement: "EU-UK-TCA",
    productValue: 8200,
    materials: [
      { hsCode: "850490", origin: "CN", value: 2000, percentage: 24.4, description: "Transformer core assemblies" },
      { hsCode: "853225", origin: "DE", value: 1650, percentage: 20.1, description: "Capacitor bank" },
      { hsCode: "854190", origin: "UK", value: 1800, percentage: 22.0, description: "Control PCB" },
      { hsCode: "850300", origin: "MX", value: 2750, percentage: 33.5, description: "Enclosure and wiring" }
    ],
    manufacturingProcesses: ["SMT Assembly", "Thermal Testing", "Firmware Calibration"],
    successCriteria: [
      "Tariff heading change documented for all sub-assemblies",
      "Critical SMT and testing steps performed in the UK",
      "Confidence score stays above 80% to unlock duty savings"
    ],
    riskFocus: [
      "Chinese core set triggers close scrutiny for value rule",
      "Need to retain process logs for firmware calibration"
    ],
    insights: {
      summary: "Heading change alternative clears despite high non-originating content thanks to UK processing logs.",
      validationNotes: [
        "Process audit trail upload confirmed accessible to customs reviewers.",
        "Confidence drop observed when testing step omitted, highlighting guard rails."
      ],
      followUpActions: [
        "Store calibration logs in central repository with certificate metadata.",
        "Configure alert if Chinese core share exceeds 25%."
      ]
    }
  },
  {
    id: "persona-qa-lead",
    name: "Sofia Watanabe",
    role: "Quality Assurance Lead, Automotive Steel Division",
    objective: "Certify annealed steel coils for EU-JP EPA preferential sourcing.",
    hsCode: "720915",
    productSku: "STEEL-JP-COIL",
    agreement: "EU-JP-EPA",
    productValue: 7100,
    materials: [
      { hsCode: "720851", origin: "KR", value: 2500, percentage: 35.2, description: "Hot-rolled coil input" },
      { hsCode: "720712", origin: "JP", value: 3200, percentage: 45.1, description: "Semi-finished billet" },
      { hsCode: "845522", origin: "JP", value: 1400, percentage: 19.7, description: "Annealing furnace services" }
    ],
    manufacturingProcesses: ["Pickling", "Annealing", "Surface Treatment"],
    successCriteria: [
      "Annealing and surface treatment proven in partner country",
      "Non-originating share kept under 35%",
      "Documentation bundle ready for OEM auditors"
    ],
    riskFocus: [
      "Annealing certificates missing supplier signature",
      "Surface treatment data captured in Japanese only"
    ],
    insights: {
      summary: "Processing alternative fails until supplier documentation is attached, mirroring audit expectations.",
      validationNotes: [
        "UI now surfaces missing supplier signatures inline.",
        "Localization helper suggests translation upload for Japanese reports."
      ],
      followUpActions: [
        "Engage supplier on digital signature rollout.",
        "Trigger translation workflow ahead of OEM audit windows."
      ]
    }
  },
  {
    id: "persona-sustainability-officer",
    name: "Aisha Rahman",
    role: "Sustainability Officer, APAC Lighting",
    objective: "Demonstrate eco-design lamp eligibility under RCEP incentives.",
    hsCode: "940540",
    productSku: "ECO-LAMP-ASIA",
    agreement: "RCEP",
    productValue: 4200,
    materials: [
      { hsCode: "940510", origin: "CN", value: 1600, percentage: 38.1, description: "LED subassemblies" },
      { hsCode: "854140", origin: "MY", value: 900, percentage: 21.4, description: "High-efficiency LED chips" },
      { hsCode: "940592", origin: "VN", value: 700, percentage: 16.7, description: "Aluminium housings" },
      { hsCode: "850440", origin: "SG", value: 1000, percentage: 23.8, description: "Smart driver module" }
    ],
    manufacturingProcesses: ["Final Assembly", "Solder Reflow", "Sustainability Audit"],
    successCriteria: [
      "Driver module treated as originating via RCEP cumulation",
      "Sustainability audit evidence linked to bill of materials",
      "Confidence > 75% to release green marketing claims"
    ],
    riskFocus: [
      "Chip supplier uses mixed-origin wafers",
      "Need to reconcile sustainability KPIs with customs data"
    ],
    insights: {
      summary: "Cumulation helper clarifies when Singapore processing qualifies, unlocking the RVC alternative.",
      validationNotes: [
        "Sustainability attachments now persist between recalculations.",
        "Scenario exports include KPI annotations for ESG reporting."
      ],
      followUpActions: [
        "Document wafer traceability statement from Malaysian partner.",
        "Align sustainability KPI glossary with customs data dictionary."
      ]
    }
  },
  {
    id: "persona-finance-controller",
    name: "Diego Martínez",
    role: "Finance Controller, North America Infrastructure",
    objective: "Quantify USMCA duty savings for modular steel structures.",
    hsCode: "730890",
    productSku: "STEEL-FRAME-USMCA",
    agreement: "USMCA",
    productValue: 9600,
    materials: [
      { hsCode: "720852", origin: "US", value: 3500, percentage: 36.5, description: "Structural steel sheet" },
      { hsCode: "730890", origin: "MX", value: 2500, percentage: 26.0, description: "Fabricated braces" },
      { hsCode: "830249", origin: "CA", value: 1100, percentage: 11.5, description: "Fastening hardware" },
      { hsCode: "850440", origin: "US", value: 2500, percentage: 26.0, description: "Control cabinet" }
    ],
    manufacturingProcesses: ["Cutting", "Robotic Welding", "Hot-Dip Galvanizing"],
    successCriteria: [
      "USMCA RVC threshold maintained above 60%",
      "Traceability report exportable for CFO review",
      "Scenario includes landed cost sensitivity"
    ],
    riskFocus: [
      "Braces fabricated in Mexico require tariff shift validation",
      "Control cabinet classified as non-originating component"
    ],
    insights: {
      summary: "Net-cost method recommended with interactive cost breakdown to explain savings to finance stakeholders.",
      validationNotes: [
        "Sensitivity analysis toggles now persisted in shareable links.",
        "Duty savings summary exported alongside certificate payload."
      ],
      followUpActions: [
        "Finalize CFO dashboard integration for monthly savings review.",
        "Automate reminder when RVC dips below 62%."
      ]
    }
  },
  {
    id: "persona-procurement-director",
    name: "Claire Dubois",
    role: "Procurement Director, Specialty Polymers",
    objective: "Compare recycled polymer blends against CETA thresholds.",
    hsCode: "390120",
    productSku: "HDPE-CIRCULAR",
    agreement: "CETA",
    productValue: 6400,
    materials: [
      { hsCode: "271019", origin: "CA", value: 1800, percentage: 28.1, description: "Naphtha feedstock" },
      { hsCode: "381220", origin: "US", value: 900, percentage: 14.1, description: "Catalyst package" },
      { hsCode: "390120", origin: "EU", value: 2200, percentage: 34.4, description: "High-density PE pellets" },
      { hsCode: "390760", origin: "EU", value: 1500, percentage: 23.4, description: "Recycling additive blend" }
    ],
    manufacturingProcesses: ["Extrusion", "Recycling Loop", "Quality Assurance"],
    successCriteria: [
      "Circular content maintains conformity under value rule",
      "EU-origin additives provide tariff shift leverage",
      "Confidence score supports supplier negotiation"
    ],
    riskFocus: [
      "Catalyst package drives non-originating percentage",
      "Need scenario view on recycled content incentives"
    ],
    insights: {
      summary: "Scenario comparison view highlights recycled inputs impact on RVC and emissions KPI side-by-side.",
      validationNotes: [
        "Negotiation-ready PDF now includes recycled content notes.",
        "UI prevents double counting when additive blend shares HS code."
      ],
      followUpActions: [
        "Extend supplier scorecard with sustainability weightings.",
        "Capture negotiated thresholds in contract workspace."
      ]
    }
  },
  {
    id: "persona-innovation-analyst",
    name: "Henrik Sørensen",
    role: "Innovation Analyst, Nordic Instrumentation",
    objective: "Assess prototype gas analyser eligibility under EU-UK TCA.",
    hsCode: "903180",
    productSku: "SENSOR-NORDIC-LAB",
    agreement: "EU-UK-TCA",
    productValue: 7800,
    materials: [
      { hsCode: "903089", origin: "SE", value: 2100, percentage: 26.9, description: "Sensor core module" },
      { hsCode: "850440", origin: "UK", value: 1700, percentage: 21.8, description: "Power conditioning unit" },
      { hsCode: "902710", origin: "DE", value: 1600, percentage: 20.5, description: "Gas analysis assembly" },
      { hsCode: "850490", origin: "CN", value: 1400, percentage: 17.9, description: "Coil assembly" },
      { hsCode: "903180", origin: "IE", value: 1000, percentage: 12.8, description: "Calibration kit" }
    ],
    manufacturingProcesses: ["Precision Calibration", "Environmental Stress Testing"],
    successCriteria: [
      "Prototype qualifies despite non-originating coil assembly",
      "Calibration logs attached to origin ruling request",
      "Confidence >= 70% before presenting to product council"
    ],
    riskFocus: [
      "Chinese coil assembly triggers fallback alternative rules",
      "Need consistent HS treatment between lab and production"
    ],
    insights: {
      summary: "Advises escalation to engineering when prototype classification diverges from production template.",
      validationNotes: [
        "Persona run logs both lab and production HS references.",
        "Confidence dip triggers recommended escalation message."
      ],
      followUpActions: [
        "Sync with engineering change control to capture HS finalization.",
        "Document prototype waiver request for customs ruling."
      ]
    }
  },
  {
    id: "persona-plant-director",
    name: "Lucia Rossi",
    role: "Plant Director, Smart Power Systems",
    objective: "Balance EU-Japan supply resilience with preferential outcomes.",
    hsCode: "850440",
    productSku: "CONVERTER-EUJP",
    agreement: "EU-JP-EPA",
    productValue: 8800,
    materials: [
      { hsCode: "850490", origin: "JP", value: 2400, percentage: 27.3, description: "Magnetic core sets" },
      { hsCode: "854190", origin: "IT", value: 1900, percentage: 21.6, description: "Control PCB assembly" },
      { hsCode: "850300", origin: "JP", value: 2000, percentage: 22.7, description: "Stamped enclosures" },
      { hsCode: "903031", origin: "JP", value: 1500, percentage: 17.0, description: "Testing instrumentation" },
      { hsCode: "850490", origin: "CN", value: 1000, percentage: 11.4, description: "Transformer oil kit" }
    ],
    manufacturingProcesses: ["SMT Assembly", "Endurance Testing", "Custom Firmware Burn-in"],
    successCriteria: [
      "Document dual sourcing path for resilience narrative",
      "Ensure tariff shift holds despite Chinese transformer oil kit",
      "Confidence above 80% before board presentation"
    ],
    riskFocus: [
      "Transformer oil kit requires contingency planning",
      "Need cross-plant alignment on HS reclassification"
    ],
    insights: {
      summary: "Scenario emphasises process coverage, guiding supply chain resilience narrative.",
      validationNotes: [
        "Dual-sourcing view now indicates which suppliers maintain origin status.",
        "Risk heatmap surfaces dependence on transformer oil kit."
      ],
      followUpActions: [
        "Advance contingency plan with alternate oil supplier.",
        "Include HS alignment step in quarterly plant review."
      ]
    }
  },
  {
    id: "persona-quality-engineer",
    name: "Mei Chen",
    role: "Quality Engineer, Rubber Solutions",
    objective: "Validate blended rubber components for RCEP cost optimisation.",
    hsCode: "400110",
    productSku: "RUBBER-RCEP-FLEX",
    agreement: "RCEP",
    productValue: 5400,
    materials: [
      { hsCode: "400122", origin: "TH", value: 2200, percentage: 40.7, description: "TSR rubber" },
      { hsCode: "400110", origin: "ID", value: 1800, percentage: 33.3, description: "Latex concentrate" },
      { hsCode: "381230", origin: "CN", value: 800, percentage: 14.8, description: "Vulcanisation chemicals" },
      { hsCode: "401699", origin: "MY", value: 600, percentage: 11.1, description: "Reinforcement inserts" }
    ],
    manufacturingProcesses: ["Compounding", "Vulcanisation", "Final Inspection"],
    successCriteria: [
      "Compounding records align with HS classification",
      "Non-originating chemical package kept under 20%",
      "Confidence score meets OEM sourcing requirement (>78%)"
    ],
    riskFocus: [
      "Latex concentrate shares HS heading with finished good",
      "OEM requires proof of sustainable sourcing"
    ],
    insights: {
      summary: "Workflow now captures compounding evidence uploads and highlights wholly obtained eligibility gaps.",
      validationNotes: [
        "Checklist prevents submission without sustainable sourcing affidavit.",
        "Confidence indicator responds immediately to latex share adjustments."
      ],
      followUpActions: [
        "Automate reminder for sustainability affidavit renewal.",
        "Share compounding evidence template with suppliers."
      ]
    }
  },
  {
    id: "persona-compliance-auditor",
    name: "Gabriel Ndlovu",
    role: "Compliance Auditor, Digital Labeling",
    objective: "Audit-ready proof pack for EU-UK digital label program.",
    hsCode: "482110",
    productSku: "SMART-LABEL-EUUK",
    agreement: "EU-UK-TCA",
    productValue: 3100,
    materials: [
      { hsCode: "480255", origin: "FR", value: 900, percentage: 29.0, description: "Coated paper base" },
      { hsCode: "321590", origin: "UK", value: 600, percentage: 19.4, description: "Security inks" },
      { hsCode: "482110", origin: "ES", value: 1000, percentage: 32.3, description: "Printed label stock" },
      { hsCode: "392099", origin: "PL", value: 600, percentage: 19.4, description: "Protective laminates" }
    ],
    manufacturingProcesses: ["Offset Printing", "Variable Data Encoding", "Quality Check"],
    successCriteria: [
      "Evidence pack links HS codes with batch identifiers",
      "Security ink treated as originating under EU-UK TCA",
      "Confidence score above 80% for regulator submission"
    ],
    riskFocus: [
      "Protective laminate classification disputed in prior audit",
      "Need alignment with digital customs declaration format"
    ],
    insights: {
      summary: "Document checklist and TARIC lookup integration give auditors a first-pass compliance view.",
      validationNotes: [
        "Batch-to-certificate linking now visible in UI preview.",
        "Digital declaration export validated against latest schema."
      ],
      followUpActions: [
        "Coordinate pilot filing with customs authority sandbox.",
        "Train audit team on new declaration export workflow."
      ]
    }
  },
  {
    id: "custom",
    name: "Custom Scenario",
    role: "Ad-hoc Analyst",
    objective: "Manually input data for exploratory calculations.",
    hsCode: "",
    productSku: "",
    agreement: "CETA",
    productValue: 1000,
    materials: [],
    manufacturingProcesses: [],
    successCriteria: [
      "Define your own acceptance thresholds before creating certificates."
    ],
    riskFocus: [
      "Ensure HS codes contain six digits.",
      "Provide at least one material row to run the engine."
    ],
    insights: {
      summary: "Custom persona enforces validation rules discovered during UAT to avoid empty submissions.",
      validationNotes: [
        "HS code, agreement and material guard rails prevent incomplete API calls.",
        "UI surfaces TARIC guidance when unknown HS code is entered."
      ],
      followUpActions: [
        "Capture custom scenarios to extend regression library.",
        "Use TARIC integration to enrich ad-hoc HS research."
      ]
    }
  }
];
