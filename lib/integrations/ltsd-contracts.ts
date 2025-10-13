import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u, 'Expected ISO date (YYYY-MM-DD)');

const isoDateTimeSchema = z
  .string()
  .regex(
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?Z$/u,
    'Expected UTC timestamp'
  );

const uuidSchema = z.string().uuid();
const countryCodeSchema = z.string().regex(/^[A-Z]{2}$/u, 'Expected ISO 3166-1 alpha-2 code');
const agreementCodeSchema = z.string().regex(/^[A-Z0-9]{2,10}$/u, 'Invalid agreement code');
const hsChapterSchema = z.string().regex(/^[0-9]{2}$/u, 'Invalid HS chapter');
const hsHeadingSchema = z.string().regex(/^[0-9]{4}$/u, 'Invalid HS heading');
const hsSubheadingSchema = z
  .string()
  .regex(/^[0-9]{6,8}$/u, 'Invalid HS subheading');
const ruleIdSchema = z
  .string()
  .regex(/^[A-Z]{2,5}-HS[0-9]{2}-[0-9]{3}$/u, 'Invalid rule identifier');
const operationCodeSchema = z
  .string()
  .regex(/^[A-Z0-9_-]{3,32}$/u, 'Invalid operation code');
const certificateCodeSchema = z.string().min(2).max(64);
const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/u, 'Invalid currency code');
const reasonCodeSchema = z.string().regex(/^[A-Z0-9_]{3,32}$/u, 'Invalid reason code');

const agreementSchema = z
  .object({
    code: agreementCodeSchema,
    name: z.string().min(5).max(255),
  })
  .passthrough();

const hsCodeSchema = z
  .object({
    chapter: hsChapterSchema,
    heading: hsHeadingSchema,
    subheading: hsSubheadingSchema,
  })
  .passthrough();

const monetaryValueSchema = z
  .object({
    amount: z.number().min(0),
    currency: currencyCodeSchema,
  })
  .passthrough();

const billOfMaterialsItemSchema = z
  .object({
    line_id: z.string().min(1).max(64),
    description: z.string().min(3).max(512),
    hs_code: z.string().regex(/^[0-9]{4,8}$/u, 'Invalid HS code'),
    country_of_origin: countryCodeSchema,
    value: monetaryValueSchema,
    is_originating: z.boolean(),
  })
  .passthrough();

const productionOperationSchema = z
  .object({
    code: operationCodeSchema,
    performed_at: isoDateTimeSchema.optional(),
    location: countryCodeSchema.optional(),
  })
  .passthrough();

const processSnapshotSchema = z
  .object({
    performed_operations: z.array(productionOperationSchema).min(1),
    total_manufacturing_cost: monetaryValueSchema,
    value_added_percentage: z.number().min(0).max(100),
  })
  .passthrough();

const documentationSnapshotSchema = z
  .object({
    submitted_certificates: z.array(certificateCodeSchema).min(1),
    evidence: z.record(z.string().min(1), z.string()),
  })
  .passthrough();

const evaluationContextSchema = z
  .object({
    tenant_id: uuidSchema,
    request_id: uuidSchema,
    agreement: agreementSchema,
    hs_code: hsCodeSchema,
    effective_date: isoDateSchema,
    import_country: countryCodeSchema,
    export_country: countryCodeSchema,
  })
  .passthrough();

export const evaluationInputSchema = z
  .object({
    context: evaluationContextSchema,
    bill_of_materials: z.array(billOfMaterialsItemSchema).min(1),
    process: processSnapshotSchema,
    documentation: documentationSnapshotSchema,
  })
  .passthrough();

export const evaluateRequestSchema = z
  .object({
    rule_id: ruleIdSchema,
    evaluation_input: evaluationInputSchema,
    evaluation_id: uuidSchema.optional(),
  })
  .passthrough();

const citationSchema = z
  .object({
    reference: z.string().min(5).max(512),
    section: z.string().min(1).max(128).optional(),
    url: z.string().url().max(1024).optional(),
  })
  .passthrough();

const disqualificationReasonSchema = z
  .object({
    code: reasonCodeSchema,
    description: z.string().min(5).max(2048),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
  })
  .passthrough();

const evaluationVerdictSchema = z
  .object({
    evaluation_id: uuidSchema,
    rule_id: ruleIdSchema,
    status: z.enum(['qualified', 'disqualified', 'manual_review']),
    decided_at: isoDateTimeSchema,
    confidence: z.number().min(0).max(1),
    citations: z.array(citationSchema).min(1),
    disqualification_reasons: z.array(disqualificationReasonSchema).default([]),
    notes: z.string().max(2048).optional(),
    ledger_reference: z.string().regex(/^ledger:\/\/[-/a-z0-9]+$/u).optional(),
  })
  .passthrough();

const evaluationOutputSchema = z
  .object({
    verdict: evaluationVerdictSchema,
  })
  .passthrough();

export const evaluateResponseSchema = z
  .object({
    evaluation: evaluationOutputSchema,
    ledger_reference: z.string().regex(/^ledger:\/\/[-/a-z0-9]+$/u),
  })
  .passthrough();

const partySchema = z
  .object({
    name: z.string().min(3).max(255),
    street: z.string().min(3).max(255),
    city: z.string().min(2).max(128),
    postal_code: z.string().min(2).max(32),
    country: countryCodeSchema,
    address_line2: z.string().min(3).max(255).optional(),
    vat_number: z.string().min(5).max(32).optional(),
  })
  .passthrough();

const generateCertificateRequestBaseSchema = z
  .object({
    evaluation_id: uuidSchema,
    certificate_code: certificateCodeSchema,
    supplier: partySchema,
    customer: partySchema,
    valid_from: isoDateSchema,
    valid_to: isoDateSchema,
    signatory_name: z.string().min(3).max(128),
    signatory_title: z.string().min(3).max(128),
    issue_location: z.string().min(2).max(128),
    notes: z.string().max(1024).optional(),
  })
  .passthrough();

export const generateCertificateRequestSchema = generateCertificateRequestBaseSchema.superRefine((value, ctx) => {
  if (value.valid_to < value.valid_from) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'valid_to must be on or after valid_from',
      path: ['valid_to'],
    });
  }
});

export type EvaluateRequestPayload = z.infer<typeof evaluateRequestSchema>;
export type EvaluateResponsePayload = z.infer<typeof evaluateResponseSchema>;
export type GenerateCertificateRequestPayload = z.infer<typeof generateCertificateRequestSchema>;
