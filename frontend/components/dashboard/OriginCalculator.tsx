'use client';

import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InvoiceValidator } from '@/components/invoices/InvoiceValidator';
import type { Material } from '@/lib/advanced-origin-engine';
import {
  personaScenarios,
  type PersonaScenario,
  type PersonaMaterial
} from '@/data/persona-scenarios';
import { telemetry } from '@/lib/telemetry/events';

const AGREEMENT_OPTIONS = Array.from(
  new Set([
    ...personaScenarios.map(persona => persona.agreement),
    'CETA',
    'EU-UK-TCA',
    'EU-JP-EPA',
    'RCEP',
    'USMCA'
  ])
).filter(Boolean) as string[];

AGREEMENT_OPTIONS.sort();

const PERSONA_SEGMENTS: Record<string, string[]> = {
  'persona-import-specialist': ['analyst', 'compliance'],
  'persona-customs-manager': ['compliance', 'supplier'],
  'persona-qa-lead': ['compliance', 'analyst'],
  'persona-sustainability-officer': ['analyst', 'supplier'],
  'persona-finance-controller': ['finance', 'analyst'],
  'persona-procurement-director': ['finance', 'supplier'],
  'persona-innovation-analyst': ['analyst'],
  'persona-plant-director': ['sysadmin', 'compliance'],
  'persona-quality-engineer': ['compliance', 'supplier'],
};

const DEFAULT_SEGMENTS = ['analyst', 'compliance'];

interface MaterialInput extends Material {
  id: string;
  description?: string;
}

type MaterialFieldErrors = Partial<{
  hsCode: string;
  origin: string;
  value: string;
}>;

interface CalculationRule {
  id: string;
  ruleText: string;
  priority?: number | null;
}

interface AlternativeEvaluation {
  type: string;
  result: boolean;
  confidence?: number;
  details?: string;
}

interface CalculationPayload {
  certificateId: string;
  result: {
    isConform: boolean;
    confidence: number;
    explanation?: string;
    appliedRules: CalculationRule[];
    alternatives?: AlternativeEvaluation[];
    calculations?: {
      rvc?: number;
      maxNom?: number;
      changeOfTariff?: boolean;
      whollyObtained?: boolean;
    };
    tradeAgreement: string;
    hsCode: string;
  };
  certificate?: {
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

type FieldErrors = Partial<{
  hsCode: string;
  productSku: string;
  agreement: string;
  productValue: string;
  materials: string;
}>;

const HS_CODE_HINT_ID = 'origin-hs-hint';
const PRODUCT_SKU_HINT_ID = 'origin-sku-hint';
const AGREEMENT_HINT_ID = 'origin-agreement-hint';
const PRODUCT_VALUE_HINT_ID = 'origin-value-hint';
const MATERIALS_HINT_ID = 'origin-materials-hint';
const HS_CODE_ERROR_ID = `${HS_CODE_HINT_ID}-error`;
const PRODUCT_SKU_ERROR_ID = `${PRODUCT_SKU_HINT_ID}-error`;
const AGREEMENT_ERROR_ID = `${AGREEMENT_HINT_ID}-error`;
const PRODUCT_VALUE_ERROR_ID = `${PRODUCT_VALUE_HINT_ID}-error`;
const MATERIALS_ERROR_ID = `${MATERIALS_HINT_ID}-error`;

type MaterialErrorsState = Record<string, MaterialFieldErrors>;

function generateId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normaliseHs(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

function asMaterialInput(material: PersonaMaterial, index: number, personaId: string): MaterialInput {
  return {
    id: `${personaId}-${index}-${material.hsCode}`,
    hsCode: normaliseHs(material.hsCode),
    origin: material.origin,
    value: material.value,
    percentage: material.percentage,
    description: material.description
  };
}

function createEmptyMaterial(): MaterialInput {
  return {
    id: generateId('material'),
    hsCode: '',
    origin: '',
    value: 0,
    percentage: 0,
    description: ''
  };
}

const DEFAULT_PERSONA = personaScenarios[0];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value);
}

export function OriginCalculator({
  onCertificateCreated
}: {
  onCertificateCreated?: (certificateId: string) => void;
}) {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(DEFAULT_PERSONA.id);
  const [hsCode, setHsCode] = useState<string>(DEFAULT_PERSONA.hsCode ?? '');
  const [productSku, setProductSku] = useState<string>(DEFAULT_PERSONA.productSku ?? '');
  const [agreement, setAgreement] = useState<string>(DEFAULT_PERSONA.agreement ?? '');
  const [productValue, setProductValue] = useState<number>(DEFAULT_PERSONA.productValue);
  const [materials, setMaterials] = useState<MaterialInput[]>(
    DEFAULT_PERSONA.materials.map((material, index) => asMaterialInput(material, index, DEFAULT_PERSONA.id))
  );
  const [manufacturingProcesses, setManufacturingProcesses] = useState<string[]>([...DEFAULT_PERSONA.manufacturingProcesses]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculation, setCalculation] = useState<CalculationPayload | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [materialErrors, setMaterialErrors] = useState<MaterialErrorsState>({});

  const hsTemplatePersona = useMemo<PersonaScenario | undefined>(
    () => personaScenarios.find(persona => persona.hsCode && persona.hsCode.startsWith('39')),
    []
  );

  const setFieldError = (field: keyof FieldErrors, message: string) => {
    setFieldErrors({ [field]: message });
    setError(message);
  };

  const selectedPersona = useMemo<PersonaScenario | undefined>(
    () => personaScenarios.find(persona => persona.id === selectedPersonaId),
    [selectedPersonaId]
  );
  const validatorSegments = useMemo(
    () => (selectedPersona ? PERSONA_SEGMENTS[selectedPersona.id] ?? DEFAULT_SEGMENTS : DEFAULT_SEGMENTS),
    [selectedPersona]
  );

  const totalMaterialValue = useMemo(
    () => materials.reduce((total, material) => total + (Number.isFinite(material.value!) ? material.value! : 0), 0),
    [materials]
  );

  const materialCoverage = useMemo(() => {
    if (!productValue || productValue <= 0) {
      return 0;
    }
    return (totalMaterialValue / productValue) * 100;
  }, [productValue, totalMaterialValue]);

  const coverageDelta = useMemo(() => productValue - totalMaterialValue, [productValue, totalMaterialValue]);

  const derivedMaterials = useMemo(() => {
    return materials.map(material => ({
      ...material,
      percentage: productValue > 0 ? (material.value! / productValue) * 100 : material.percentage
    }));
  }, [materials, productValue]);

  const resetMessages = useCallback(() => {
    setError(null);
    setStatusMessage(null);
    setFieldErrors({});
    setMaterialErrors({});
  }, []);

  const validateMaterial = useCallback((material: MaterialInput): MaterialFieldErrors => {
    const errors: MaterialFieldErrors = {};
    const normalizedHs = normaliseHs(material.hsCode);
    if (normalizedHs.length !== 6) {
      errors.hsCode = 'Voer een HS6-code (exact zes cijfers) in.';
    }

    const trimmedOrigin = material.origin.trim().toUpperCase();
    if (trimmedOrigin.length < 2 || trimmedOrigin.length > 3) {
      errors.origin = 'Gebruik een landcode van twee of drie tekens (bijv. EU).';
    }

    const numericValue = Number(material.value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      errors.value = 'Materiaalwaarde moet groter zijn dan nul.';
    }

    return errors;
  }, []);

  const sanitizeMaterials = useCallback(
    (items: MaterialInput[]) => {
      return items
        .map(material => ({
          hsCode: normaliseHs(material.hsCode),
          origin: material.origin.trim().toUpperCase(),
          value: Number(material.value) || 0,
          percentage:
            productValue > 0 ? (Number(material.value) / productValue) * 100 : material.percentage,
          description: material.description?.trim() || undefined
        }))
        .filter(material => material.hsCode.length === 6 && material.origin.length > 0);
    },
    [productValue]
  );

  const applyPersona = useCallback((persona: PersonaScenario) => {
    setHsCode(persona.hsCode ?? '');
    setProductSku(persona.productSku ?? '');
    setAgreement(persona.agreement ?? '');
    setProductValue(persona.productValue);
    setMaterials(persona.materials.map((material, index) => asMaterialInput(material, index, persona.id)));
    setManufacturingProcesses([...persona.manufacturingProcesses]);
    setCalculation(null);
    setStatusMessage(`Scenario van ${persona.name} geladen.`);
    setError(null);
    setFieldErrors({});
    setMaterialErrors({});
  }, []);

  useEffect(() => {
    if (!selectedPersona) {
      return;
    }

    if (selectedPersona.id === 'custom') {
      return;
    }

    applyPersona(selectedPersona);
  }, [selectedPersona, applyPersona]);

  const handlePersonaChange = (personaId: string) => {
    setSelectedPersonaId(personaId);
    if (personaId === 'custom') {
      resetMessages();
      setStatusMessage('Aangepaste scenario actief. Vul handmatig de gegevens in.');
      setFieldErrors({});
      setMaterialErrors({});
    }
  };

  const loadHsTemplate = useCallback(() => {
    const template = hsTemplatePersona ?? DEFAULT_PERSONA;
    setSelectedPersonaId('custom');
    setHsCode(template.hsCode ?? '');
    setProductSku(template.productSku ?? '');
    setAgreement(template.agreement ?? '');
    setProductValue(template.productValue);
    setMaterials(template.materials.map((material, index) => asMaterialInput(material, index, template.id)));
    setManufacturingProcesses([...template.manufacturingProcesses]);
    setCalculation(null);
    setStatusMessage('HS39/40 voorbeeldmaterialen geladen. Pas de waarden naar wens aan.');
    setError(null);
    setFieldErrors({});
    setMaterialErrors({});
  }, [hsTemplatePersona]);

  const updateMaterial = (id: string, patch: Partial<MaterialInput>) => {
    setMaterials(current => {
      const next = current.map(material => (material.id === id ? { ...material, ...patch } : material));
      const updated = next.find(material => material.id === id);
      if (updated) {
        const validation = validateMaterial(updated);
        setMaterialErrors(previous => {
          const nextErrors = { ...previous };
          if (Object.keys(validation).length > 0) {
            nextErrors[id] = validation;
          } else {
            delete nextErrors[id];
          }
          return nextErrors;
        });
      }
      return next;
    });
  };

  const removeMaterial = (id: string) => {
    setMaterials(current => current.filter(material => material.id !== id));
    setMaterialErrors(current => {
      if (!current[id]) {
        return current;
      }
      const { [id]: _removed, ...rest } = current;
      return rest;
    });
  };

  const addMaterial = () => {
    const nextMaterial = createEmptyMaterial();
    setMaterials(current => [...current, nextMaterial]);
    setMaterialErrors(current => ({
      ...current,
      [nextMaterial.id]: {
        hsCode: 'Vul een HS6-code in voor deze rij.',
        origin: 'Landcode vereist voor douanerapportage.',
        value: 'Voeg een waarde toe zodat de verdeling klopt.',
      },
    }));
  };

  const handleCalculate = useCallback(async () => {
    resetMessages();

    const sanitizedHs = normaliseHs(hsCode);
    const sanitizedSku = productSku.trim();

    if (sanitizedHs.length !== 6) {
      setFieldError('hsCode', 'HS-code moet uit precies zes cijfers bestaan (bijv. 390110).');
      return;
    }

    if (!sanitizedSku) {
      setFieldError('productSku', 'Voer een product SKU in om certificaten te koppelen.');
      return;
    }

    if (!agreement) {
      setFieldError('agreement', 'Selecteer een handelsverdrag voor deze berekening.');
      return;
    }

    if (materials.length === 0) {
      setFieldError('materials', 'Voeg minimaal één materiaal toe om een berekening uit te voeren.');
      return;
    }

    if (productValue <= 0) {
      setFieldError('productValue', 'Productwaarde moet groter zijn dan nul.');
      return;
    }

    const aggregatedErrors = materials.reduce<MaterialErrorsState>((acc, material) => {
      const validation = validateMaterial(material);
      if (Object.keys(validation).length > 0) {
        acc[material.id] = validation;
      }
      return acc;
    }, {});

    if (Object.keys(aggregatedErrors).length > 0) {
      setMaterialErrors(aggregatedErrors);
      setFieldError(
        'materials',
        'Los de gemarkeerde materiaalfouten op voordat u de berekening start.'
      );
      return;
    }

    const preparedMaterials = sanitizeMaterials(materials);

    if (preparedMaterials.length === 0) {
      setFieldError('materials', 'Alle materiaalregels moeten een geldige HS-code en oorsprong bevatten.');
      return;
    }

    if (Math.abs(totalMaterialValue - productValue) > productValue * 0.6) {
      setStatusMessage('Let op: materiaalwaarde wijkt sterk af van de productwaarde. Controleer uw cijfers.');
    }

    const personaLabel = selectedPersona?.name ?? 'Onbekende persona';
    telemetry.originCheckStarted(personaLabel);

    setIsCalculating(true);
    setError(null);
    setStatusMessage('Berekening wordt uitgevoerd…');

    try {
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const response = await fetch('/api/origin/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PSRA-Roles': 'origin:write analyst:read',
        },
        body: JSON.stringify({
          productSku: sanitizedSku,
          hsCode: sanitizedHs,
          tradeAgreement: agreement,
          materials: preparedMaterials,
          productValue,
          manufacturingProcesses
        })
      });

      if (!response.ok) {
        const message = `Berekening mislukt (status ${response.status}).`;
        throw new Error(message);
      }

      const data: CalculationPayload = await response.json();
      setCalculation(data);
      setStatusMessage(`Certificaat ${data.certificateId} succesvol opgeslagen.`);
      onCertificateCreated?.(data.certificateId);

      const completedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const durationMs = completedAt - startedAt;
      telemetry.originCheckSuccess(personaLabel, durationMs, {
        agreement,
        hsCode: sanitizedHs,
        certificateId: data.certificateId,
      });
      telemetry.ltsdGenerated(personaLabel, durationMs, {
        status: data.certificate?.status ?? 'unknown',
        tradeAgreement: data.result.tradeAgreement,
      });
    } catch (err) {
      console.error('Calculation error', err);
      setError(err instanceof Error ? err.message : 'Onbekende fout tijdens berekening.');
      setStatusMessage(null);
      telemetry.errorModalViewed(personaLabel, {
        context: 'origin_calculator',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsCalculating(false);
    }
  }, [
    agreement,
    hsCode,
    manufacturingProcesses,
    materials,
    productSku,
    productValue,
    onCertificateCreated,
    resetMessages,
    sanitizeMaterials,
    totalMaterialValue,
    validateMaterial,
    selectedPersona
  ]);

  const personaInsights = selectedPersona?.insights;

  const renderInsightList = (label: string, items: string[] | undefined, icon: string) => {
    if (!items || items.length === 0) {
      return null;
    }

    return (
      <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface-muted)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted">
          <span className="text-base" aria-hidden="true">
            {icon}
          </span>
          {label}
        </div>
        <ul className="mt-2 space-y-1.5 text-sm text-subtle">
          {items.map(item => (
            <li key={`${label}-${item}`} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const confidence = calculation ? Math.round(calculation.result.confidence * 100) : 0;
  const isConform = calculation?.result.isConform ?? false;

  return (
    <section className="card p-8" aria-live="polite">
      <div className="flex flex-col gap-3 border-b border-[rgba(148,163,184,0.2)] pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="section-title">Origin calculator</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            Guided UAT personas voor preferentiële oorsprongsbepaling
          </h2>
          <p className="mt-2 max-w-3xl text-base text-subtle">
            Voer productdetails in of kies een gevalideerd persona-scenario om direct een simulatie met het LangGraph-origin-engine te draaien. De materiaalverdeelsleutel wordt automatisch gevalideerd en gekoppeld aan productieprocessen.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="grid gap-4 rounded-2xl bg-[var(--color-surface-muted)]/60 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="persona" className="section-title">
                Persona-scenario
              </label>
              <select
                id="persona"
                value={selectedPersonaId}
                onChange={event => handlePersonaChange(event.target.value)}
                className="mt-2 w-full"
              >
                {personaScenarios.map(persona => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name} — {persona.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hsCode" className="section-title">
                HS-code
              </label>
              <input
                id="hsCode"
                inputMode="numeric"
                pattern="[0-9]*"
                value={hsCode}
                onChange={event => setHsCode(normaliseHs(event.target.value))}
                placeholder="Bijv. 390110"
                className="mt-2 w-full"
                aria-invalid={Boolean(fieldErrors.hsCode)}
                aria-describedby={fieldErrors.hsCode ? `${HS_CODE_HINT_ID} ${HS_CODE_ERROR_ID}` : HS_CODE_HINT_ID}
              />
              <p id={HS_CODE_HINT_ID} className="input-hint">Gebruik het HS39/40 import-scenario als startpunt of voer een zescijferige code in.</p>
              {fieldErrors.hsCode && (
                <p id={HS_CODE_ERROR_ID} className="field-error">{fieldErrors.hsCode}</p>
              )}
            </div>

            <div>
              <label htmlFor="productSku" className="section-title">
                Product SKU
              </label>
              <input
                id="productSku"
                value={productSku}
                onChange={event => setProductSku(event.target.value)}
                placeholder="Unieke referentie"
                className="mt-2 w-full"
                aria-invalid={Boolean(fieldErrors.productSku)}
                aria-describedby={
                  fieldErrors.productSku ? `${PRODUCT_SKU_HINT_ID} ${PRODUCT_SKU_ERROR_ID}` : PRODUCT_SKU_HINT_ID
                }
              />
              <p id={PRODUCT_SKU_HINT_ID} className="input-hint">Gebruik dezelfde referentie als in uw HS39/40 importbestanden voor traceerbaarheid.</p>
              {fieldErrors.productSku && (
                <p id={PRODUCT_SKU_ERROR_ID} className="field-error">{fieldErrors.productSku}</p>
              )}
            </div>

            <div>
              <label htmlFor="agreement" className="section-title">
                Handelsverdrag
              </label>
              <select
                id="agreement"
                value={agreement}
                onChange={event => setAgreement(event.target.value)}
                className="mt-2 w-full"
                aria-invalid={Boolean(fieldErrors.agreement)}
                aria-describedby={
                  fieldErrors.agreement ? `${AGREEMENT_HINT_ID} ${AGREEMENT_ERROR_ID}` : AGREEMENT_HINT_ID
                }
              >
                {AGREEMENT_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p id={AGREEMENT_HINT_ID} className="input-hint">Kies het verdrag zodat toepasselijke oorsprongsregels automatisch worden geladen.</p>
              {fieldErrors.agreement && (
                <p id={AGREEMENT_ERROR_ID} className="field-error">{fieldErrors.agreement}</p>
              )}
            </div>

            <div>
              <label htmlFor="productValue" className="section-title">
                Productwaarde (USD)
              </label>
              <input
                id="productValue"
                type="number"
                min="0"
                step="0.01"
                value={productValue}
                onChange={event => setProductValue(Number(event.target.value) || 0)}
                className="mt-2 w-full"
                aria-invalid={Boolean(fieldErrors.productValue)}
                aria-describedby={
                  fieldErrors.productValue
                    ? `${PRODUCT_VALUE_HINT_ID} ${PRODUCT_VALUE_ERROR_ID}`
                    : PRODUCT_VALUE_HINT_ID
                }
              />
              <p id={PRODUCT_VALUE_HINT_ID} className="input-hint">Totale factuurwaarde inclusief HS39/40 materialen; gebruik decimale punt voor centen.</p>
              {fieldErrors.productValue && (
                <p id={PRODUCT_VALUE_ERROR_ID} className="field-error">{fieldErrors.productValue}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="processes" className="section-title">
                Productieprocessen
              </label>
              <textarea
                id="processes"
                rows={3}
                value={manufacturingProcesses.join('\n')}
                onChange={event =>
                  setManufacturingProcesses(
                    event.target.value
                      .split('\n')
                      .map(value => value.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Elke regel vertegenwoordigt een processtap"
                className="mt-2 w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="section-title">Bill of Materials</p>
              <button type="button" className="ghost" onClick={addMaterial}>
                + Materiaal toevoegen
              </button>
            </div>
            <div
              className="mt-3 overflow-x-auto"
              aria-describedby={fieldErrors.materials ? `${MATERIALS_HINT_ID} ${MATERIALS_ERROR_ID}` : MATERIALS_HINT_ID}
            >
              <table className="min-w-full divide-y divide-[rgba(148,163,184,0.2)] text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="text-left text-xs font-semibold text-subtle">
                      HS-code
                    </th>
                    <th scope="col" className="text-left text-xs font-semibold text-subtle">
                      Oorsprong
                    </th>
                    <th scope="col" className="text-right text-xs font-semibold text-subtle">
                      Waarde
                    </th>
                    <th scope="col" className="text-right text-xs font-semibold text-subtle">
                      Aandeel
                    </th>
                    <th scope="col" className="text-left text-xs font-semibold text-subtle">
                      Beschrijving
                    </th>
                    <th scope="col" className="text-right text-xs font-semibold text-subtle">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(148,163,184,0.12)]">
                  {derivedMaterials.map(material => {
                    const rowErrors = materialErrors[material.id] ?? {};
                    return (
                      <tr key={material.id} className="align-top">
                        <td className="py-3 pr-3">
                          <div className="space-y-1">
                            <input
                              value={material.hsCode}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              onChange={event =>
                                updateMaterial(material.id, { hsCode: normaliseHs(event.target.value) })
                              }
                              aria-label="HS-code materiaal"
                              aria-invalid={Boolean(rowErrors.hsCode)}
                            />
                            {rowErrors.hsCode && <p className="field-error">{rowErrors.hsCode}</p>}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <div className="space-y-1">
                            <input
                              value={material.origin}
                              onChange={event => updateMaterial(material.id, { origin: event.target.value.toUpperCase() })}
                              aria-label="Land van oorsprong"
                              maxLength={3}
                              aria-invalid={Boolean(rowErrors.origin)}
                            />
                            {rowErrors.origin && <p className="field-error">{rowErrors.origin}</p>}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-right">
                          <div className="space-y-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={material.value}
                              onChange={event =>
                                updateMaterial(material.id, { value: Number(event.target.value) || 0 })
                              }
                              aria-label="Materiaalwaarde"
                              aria-invalid={Boolean(rowErrors.value)}
                            />
                            {rowErrors.value && <p className="field-error">{rowErrors.value}</p>}
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-right text-subtle">
                          {material.percentage!.toFixed(1)}%
                        </td>
                        <td className="py-3 pr-3">
                          <input
                            value={material.description ?? ''}
                            onChange={event => updateMaterial(material.id, { description: event.target.value })}
                            placeholder="Optioneel"
                            aria-label="Materiaalbeschrijving"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            className="text-sm font-semibold text-red-500 hover:text-red-600"
                            onClick={() => removeMaterial(material.id)}
                          >
                            Verwijder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {materials.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="mx-auto max-w-xl space-y-3">
                          <p className="text-base font-semibold text-[var(--color-text)]">Nog geen materialen toegevoegd</p>
                          <p className="text-sm text-subtle">
                            Start met het HS39/40 voorbeeld voor kunststoffen of voeg handmatig regels toe. We valideren HS6-codes en oorsprong direct tijdens het typen.
                          </p>
                          <div className="flex flex-wrap justify-center gap-3">
                            <button type="button" className="primary" onClick={loadHsTemplate}>
                              HS39/40 voorbeeld laden
                            </button>
                            <button type="button" className="ghost" onClick={addMaterial}>
                              + Handmatige regel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p id={MATERIALS_HINT_ID} className="input-hint">Zorg dat de materiaalsom aansluit op de productwaarde; importeer het HS39/40 sjabloon voor een gevalideerd startpunt.</p>
            {fieldErrors.materials && (
              <p id={MATERIALS_ERROR_ID} className="field-error">{fieldErrors.materials}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-subtle">
              <span>Totaalwaarde materialen: {formatCurrency(totalMaterialValue)}</span>
              <span
                className={clsx(
                  'font-semibold',
                  materialCoverage > 100 ? 'text-red-500' : 'text-green-500'
                )}
              >
                Dekking: {materialCoverage.toFixed(1)}%
              </span>
              <span>{coverageDelta >= 0 ? `Restwaarde: ${formatCurrency(coverageDelta)}` : `Overschrijding: ${formatCurrency(Math.abs(coverageDelta))}`}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="primary w-full sm:w-auto"
              onClick={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? 'Berekenen…' : 'Bereken oorsprong'}
            </button>
            {statusMessage && !error && <p className="text-sm text-subtle" role="status">{statusMessage}</p>}
          </div>

          {error && (
            <div
              className="rounded-xl border border-[rgba(248,113,113,0.3)] bg-[var(--color-danger-soft)]/80 p-4 text-sm text-[var(--color-danger)]"
              role="alert"
            >
              {error}
            </div>
          )}

          {calculation && (
            <div className="space-y-5 rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface-muted)]/50 p-5">
              <div
                className={clsx(
                  'rounded-2xl border p-4 shadow-sm transition-colors',
                  isConform
                    ? 'border-[rgba(74,222,128,0.35)] bg-[var(--color-success-soft)]/70'
                    : 'border-[rgba(250,204,21,0.3)] bg-[var(--color-warning-soft)]/70'
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {isConform ? '✅' : '⚠️'}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {isConform ? 'Scenario voldoet aan oorsprongsregels' : 'Scenario vereist aanvullende aandacht'}
                    </h3>
                    {calculation.result.explanation && (
                      <p className="mt-1 text-sm text-subtle">{calculation.result.explanation}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-subtle">
                    <span>Vertrouwen</span>
                    <span>{confidence}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[rgba(148,163,184,0.25)]">
                    <div
                      className={clsx(
                        'h-2 rounded-full transition-all duration-300',
                        isConform ? 'bg-[var(--color-success)]' : 'bg-[var(--color-warning)]'
                      )}
                      style={{ width: `${confidence}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              <dl className="rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-semibold text-muted">Certificaat</span>
                  <code className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-muted">
                    {calculation.certificateId}
                  </code>
                  <span className="badge badge-success">
                    {calculation.certificate?.status ?? 'done'}
                  </span>
                  <span className="ml-auto text-xs uppercase tracking-wide text-subtle">
                    {calculation.result.tradeAgreement} • HS {calculation.result.hsCode}
                  </span>
                </div>
              </dl>

              {calculation.result.appliedRules.length > 0 && (
                <div>
                  <p className="section-title">Toegepaste regels</p>
                  <ul className="mt-3 space-y-3 text-sm text-subtle">
                    {calculation.result.appliedRules.map(rule => (
                      <li
                        key={rule.id}
                        className="rounded-xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface)]/90 p-4"
                      >
                        <div className="flex items-center justify-between text-xs text-subtle">
                          <span>Rule ID: {rule.id}</span>
                          {rule.priority !== undefined && rule.priority !== null && <span>Prioriteit {rule.priority}</span>}
                        </div>
                        <p className="mt-2 text-sm text-[var(--color-text)]">{rule.ruleText}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {calculation.result.calculations && (
                <div>
                  <p className="section-title">Kernmetrics</p>
                  <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                    {calculation.result.calculations.rvc !== undefined && (
                      <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                        <dt className="text-xs uppercase tracking-wide text-subtle">Regionale waarde-inhoud</dt>
                        <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                          {calculation.result.calculations.rvc.toFixed(1)}%
                        </dd>
                      </div>
                    )}
                    {calculation.result.calculations.maxNom !== undefined && (
                      <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                        <dt className="text-xs uppercase tracking-wide text-subtle">Max. niet-oorspronkelijk aandeel</dt>
                        <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                          {calculation.result.calculations.maxNom.toFixed(1)}%
                        </dd>
                      </div>
                    )}
                    {calculation.result.calculations.changeOfTariff !== undefined && (
                      <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                        <dt className="text-xs uppercase tracking-wide text-subtle">Tariefverschuiving</dt>
                        <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                          {calculation.result.calculations.changeOfTariff ? 'Voldaan' : 'Niet voldaan'}
                        </dd>
                      </div>
                    )}
                    {calculation.result.calculations.whollyObtained !== undefined && (
                      <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                        <dt className="text-xs uppercase tracking-wide text-subtle">Volledig verkregen</dt>
                        <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                          {calculation.result.calculations.whollyObtained ? 'Ja' : 'Nee'}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {calculation.result.alternatives && calculation.result.alternatives.length > 0 && (
                <div>
                  <p className="section-title">Alternatieve evaluaties</p>
                  <ul className="mt-3 grid gap-3 lg:grid-cols-2">
                    {calculation.result.alternatives.map(alternative => (
                      <li
                        key={`${alternative.type}-${alternative.details ?? 'alt'}`}
                        className="rounded-xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface)]/90 p-4"
                      >
                        <div className="flex items-center justify-between text-xs text-subtle">
                          <span>{alternative.type.toUpperCase()}-route</span>
                          {alternative.confidence !== undefined && (
                            <span>{Math.round(alternative.confidence * 100)}%</span>
                          )}
                        </div>
                        <p
                          className={clsx(
                            'mt-2 font-medium',
                            alternative.result ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                          )}
                        >
                          {alternative.result ? '✅ Voldoet aan vereisten' : '❌ Voldoet niet aan vereisten'}
                        </p>
                        {alternative.details && (
                          <p className="mt-2 text-sm text-subtle">{alternative.details}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {selectedPersona && (
            <div className="rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/90 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-title">UAT Persona</p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--color-text)]">{selectedPersona.name}</h3>
                  <p className="text-sm text-subtle">{selectedPersona.role}</p>
                </div>
                <span className="text-2xl" aria-hidden="true">
                  🎯
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--color-text)]">{selectedPersona.objective}</p>

              {personaInsights && (
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface-muted)]/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">UAT samenvatting</p>
                    <p className="mt-2 text-sm text-[var(--color-text)]">{personaInsights.summary}</p>
                  </div>
                  {renderInsightList('Valideringsnotities', personaInsights.validationNotes, '🧪')}
                  {renderInsightList('Vervolgacties', personaInsights.followUpActions, '🗂️')}
                </div>
              )}

              {selectedPersona.successCriteria && selectedPersona.successCriteria.length > 0 && (
                <div className="mt-4">
                  <p className="section-title">Succescriteria</p>
                  <ul className="mt-2 space-y-2 text-sm text-subtle">
                    {selectedPersona.successCriteria.map(item => (
                      <li key={`${selectedPersona.id}-success-${item}`} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPersona.riskFocus && selectedPersona.riskFocus.length > 0 && (
                <div className="mt-4">
                  <p className="section-title">Risico-indicatoren</p>
                  <ul className="mt-2 space-y-2 text-sm text-subtle">
                    {selectedPersona.riskFocus.map(item => (
                      <li key={`${selectedPersona.id}-risk-${item}`} className="flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <InvoiceValidator personas={validatorSegments} />

          <div className="rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/90 p-5">
            <p className="section-title">Procesoverzicht</p>
            {manufacturingProcesses.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {manufacturingProcesses.map(process => (
                  <li
                    key={process}
                    className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]"
                  >
                    {process}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-subtle">
                Voeg processtappen toe zodat de audittrail aangeeft waar waarde is toegevoegd.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

