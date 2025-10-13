import { getInvoiceIntegrationOptions } from '@/lib/integrations/external-connectors';
import { findBomReferences } from '@/data/reference/bom-checklist';

export interface BomLineItem {
  sku: string;
  description: string;
  hsCode: string;
  value: number;
  quantity: number;
  countryOfOrigin?: string;
}

export interface InvoicePayload {
  invoiceNumber: string;
  supplierName: string;
  currency: string;
  issuedAt: string;
  bomItems: BomLineItem[];
}

export type ValidationStatus = 'pass' | 'warn' | 'fail';

export interface ValidationCheckResult {
  id: string;
  label: string;
  status: ValidationStatus;
  details: string;
  severity: 'info' | 'medium' | 'high';
}

export interface EligibilityAssessment {
  eligible: boolean;
  confidence: number;
  rationale: string;
}

export interface InvoiceValidationResult {
  invoice: InvoicePayload;
  checks: ValidationCheckResult[];
  matchedReferences: ReturnType<typeof findBomReferences>;
  eligibility: EligibilityAssessment;
  integrationOptions: ReturnType<typeof getInvoiceIntegrationOptions>;
}

function summariseStatus(results: ValidationCheckResult[]): EligibilityAssessment {
  const failing = results.filter(result => result.status === 'fail');
  const warnings = results.filter(result => result.status === 'warn');

  if (failing.length > 0) {
    return {
      eligible: false,
      confidence: Math.max(0.2, 1 - failing.length * 0.2),
      rationale: `Niet geslaagd voor ${failing.length} kritieke validatoren. Los deze issues op voordat je een certificaat aanvraagt.`,
    };
  }

  if (warnings.length > 0) {
    return {
      eligible: true,
      confidence: Math.max(0.5, 1 - warnings.length * 0.1),
      rationale: 'Voorwaardelijk geschikt. Controleer de waarschuwingen voor definitieve goedkeuring.',
    };
  }

  return {
    eligible: true,
    confidence: 0.95,
    rationale: 'Alle validatoren geslaagd. Factuur en BOM voldoen aan preferentiële oorsprongseisen.',
  };
}

function runValidator(id: string, label: string, predicate: () => { passed: boolean; message: string; severity?: ValidationCheckResult['severity'] }): ValidationCheckResult {
  try {
    const outcome = predicate();
    return {
      id,
      label,
      status: outcome.passed ? 'pass' : 'fail',
      details: outcome.message,
      severity: outcome.severity ?? (outcome.passed ? 'info' : 'high'),
    };
  } catch (error) {
    return {
      id,
      label,
      status: 'warn',
      details: `Validator kon niet worden uitgevoerd: ${(error as Error).message}`,
      severity: 'medium',
    };
  }
}

function runWarnValidator(id: string, label: string, predicate: () => { passed: boolean; message: string }): ValidationCheckResult {
  const outcome = predicate();
  return {
    id,
    label,
    status: outcome.passed ? 'pass' : 'warn',
    details: outcome.message,
    severity: outcome.passed ? 'info' : 'medium',
  };
}

export function normaliseHs(code: string) {
  return code.replace(/[^0-9]/g, '').slice(0, 6);
}

export async function validateInvoice(payload: InvoicePayload): Promise<InvoiceValidationResult> {
  const enrichedInvoice: InvoicePayload = {
    ...payload,
    bomItems: payload.bomItems.map(item => ({
      ...item,
      hsCode: normaliseHs(item.hsCode),
    })),
  };

  const matchedReferences = findBomReferences(enrichedInvoice.bomItems);

  const checks: ValidationCheckResult[] = [
    runValidator('llm-3-consensus', 'LLM-3 consensus beoordeling', () => {
      const aligned = matchedReferences.every(reference => reference.matchScore >= 0.7);
      return {
        passed: aligned,
        message: aligned
          ? 'De drie LLM validators zijn het eens over de toewijzing van de HS-codes.'
          : 'Consensus ontbreekt voor sommige HS-codes. Verifieer de mapping of verrijk de omschrijvingen.',
      };
    }),
    runValidator('wco-cross-check', 'WCO bronverificatie', () => {
      const missingSources = matchedReferences.filter(reference => reference.sources.wco === false);
      return {
        passed: missingSources.length === 0,
        message:
          missingSources.length === 0
            ? 'Alle HS-codes hebben een bevestigde WCO-referentie.'
            : `${missingSources.length} codes missen een directe WCO-bron. Upload bewijs of raadpleeg TARIC.`,
      };
    }),
    runValidator('psr-rules', 'Product Specific Rules (PSR)', () => {
      const violations = matchedReferences.filter(reference => reference.thresholdBreached === true);
      return {
        passed: violations.length === 0,
        message:
          violations.length === 0
            ? 'Geen PSR schendingen gevonden. Productie voldoet aan regionale waardedrempels.'
            : `${violations.length} artikelen overschrijden de PSR drempelwaarde. Voorbeeld: ${violations[0].matchedSku} beslaat ${violations[0].materialShare.toFixed(1)}% t.o.v. de limiet van ${violations[0].regionalValueThreshold}%.`,
      };
    }),
    runWarnValidator('trade-agreements', 'Handelsafspraken check', () => {
      const agreementsMissing = matchedReferences.filter(reference => reference.tradeAgreementEligible === false);
      return {
        passed: agreementsMissing.length === 0,
        message:
          agreementsMissing.length === 0
            ? 'Alle artikelen vallen onder de geselecteerde handelsafspraken.'
            : `${agreementsMissing.length} artikelen vallen buiten de huidige handelsafspraken. Voorbeeld: ${agreementsMissing[0].matchedSku} (${agreementsMissing[0].hsCode}). Controleer alternatieve routes of uitzonderingen.`,
      };
    }),
    runWarnValidator('ruling-references', 'Binding Tariff Ruling', () => {
      const withoutRulings = matchedReferences.filter(reference => !reference.bindingRulingId);
      return {
        passed: withoutRulings.length === 0,
        message:
          withoutRulings.length === 0
            ? 'Voor alle artikelen is een recente ruling beschikbaar.'
            : `${withoutRulings.length} artikelen missen een ruling. Voeg rulings toe om de audit trail te versterken.`,
      };
    }),
    runWarnValidator('de-minimis', 'De-minimis controle', () => {
      const totalValue = enrichedInvoice.bomItems.reduce((acc, item) => acc + item.value, 0);
      const deMinimisLimit = matchedReferences.reduce((acc, reference) => acc + reference.deMinimisAllowance, 0);
      const withinLimit = totalValue <= deMinimisLimit || deMinimisLimit === 0;
      return {
        passed: withinLimit,
        message: withinLimit
          ? `De totale waarde (€${totalValue.toFixed(2)}) valt binnen de de-minimis vrijstellingen (limiet €${deMinimisLimit.toFixed(2)}).`
          : `Totale waarde (€${totalValue.toFixed(2)}) overschrijdt de de-minimis vrijstelling (limiet €${deMinimisLimit.toFixed(2)}). Documenteer aanvullende bewijsvoering.`,
      };
    }),
  ];

  const eligibility = summariseStatus(checks);

  return {
    invoice: enrichedInvoice,
    checks,
    matchedReferences,
    eligibility,
    integrationOptions: getInvoiceIntegrationOptions(),
  };
}
