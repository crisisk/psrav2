import { z } from 'zod';

/**
 * Common API Schemas (Zod)
 * Shared validation schemas for API requests/responses
 */

// Assessment Verdict
export const VerdictSchema = z.enum(['GO', 'NO_GO', 'PENDING', 'REVIEW']);
export type Verdict = z.infer<typeof VerdictSchema>;

// Assessment Status
export const AssessmentStatusSchema = z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'FAILED']);
export type AssessmentStatus = z.infer<typeof AssessmentStatusSchema>;

// Assessment Record
export const AssessmentSchema = z.object({
  id: z.string().uuid(),
  ltsdId: z.string().uuid(),
  hsCode: z.string(),
  productName: z.string(),
  verdict: VerdictSchema,
  status: AssessmentStatusSchema,
  agreement: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

// Insights Overview
export const InsightsOverviewSchema = z.object({
  p95Latency: z.number(), // ms
  passFailLast7d: z.object({
    pass: z.number(),
    fail: z.number(),
  }),
  exceptionsOpen: z.number(),
  ltsdDueSoon: z.number(),
});
export type InsightsOverview = z.infer<typeof InsightsOverviewSchema>;

// CFO KPIs
export const CfoKpisSchema = z.object({
  savingsMtd: z.number(), // euros
  atRisk: z.number(), // euros
  avgDecisionTime: z.number(), // seconds
  openApprovals: z.number(),
});
export type CfoKpis = z.infer<typeof CfoKpisSchema>;

// CFO Trend Data Point
export const TrendDataPointSchema = z.object({
  date: z.string(), // ISO date
  pass: z.number(),
  fail: z.number(),
  savings: z.number().optional(),
});
export type TrendDataPoint = z.infer<typeof TrendDataPointSchema>;

// CFO Savings by Agreement
export const SavingsByAgreementSchema = z.object({
  agreement: z.string(),
  savings: z.number(),
  count: z.number(),
});
export type SavingsByAgreement = z.infer<typeof SavingsByAgreementSchema>;

// Risk Entry
export const RiskEntrySchema = z.object({
  id: z.string().uuid(),
  ltsdId: z.string().uuid(),
  product: z.string(),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  value: z.number(), // euros
  reason: z.string(),
});
export type RiskEntry = z.infer<typeof RiskEntrySchema>;

// Approval Entry
export const ApprovalEntrySchema = z.object({
  id: z.string().uuid(),
  supplier: z.string(),
  product: z.string(),
  value: z.number(),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  submittedAt: z.string().datetime(),
});
export type ApprovalEntry = z.infer<typeof ApprovalEntrySchema>;

// Chain/BOM Node
export const ChainNodeSchema: any = z.lazy(() => z.object({
  id: z.string().uuid(),
  hsCode: z.string().optional(),
  description: z.string(),
  originCountry: z.string().optional(),
  hasCoo: z.boolean(),
  cooDocumentId: z.string().uuid().optional(),
  children: z.array(ChainNodeSchema).optional(),
}));
export type ChainNode = z.infer<typeof ChainNodeSchema>;

// Chain Graph Status
export const ChainStatusSchema = z.enum(['INCOMPLETE', 'COMPLETE', 'VALIDATED']);
export type ChainStatus = z.infer<typeof ChainStatusSchema>;

// Chain Overview
export const ChainOverviewSchema = z.object({
  ltsdId: z.string().uuid(),
  status: ChainStatusSchema,
  coveragePercent: z.number().min(0).max(100),
  totalNodes: z.number(),
  nodesWithCoo: z.number(),
  rootNode: ChainNodeSchema.optional(),
});
export type ChainOverview = z.infer<typeof ChainOverviewSchema>;

// CoO Upload Init Request
export const CooUploadInitRequestSchema = z.object({
  ltsdId: z.string().uuid(),
  nodeId: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
});
export type CooUploadInitRequest = z.infer<typeof CooUploadInitRequestSchema>;

// CoO Upload Init Response
export const CooUploadInitResponseSchema = z.object({
  uploadUrl: z.string().url(),
  documentId: z.string().uuid(),
  expiresAt: z.string().datetime(),
});
export type CooUploadInitResponse = z.infer<typeof CooUploadInitResponseSchema>;

// CoO Request (Missing CoO → email supplier)
export const CooRequestSchema = z.object({
  ltsdId: z.string().uuid(),
  nodeId: z.string().uuid(),
  supplierEmail: z.string().email(),
  message: z.string().optional(),
});
export type CooRequest = z.infer<typeof CooRequestSchema>;

// XAI Checkpoint
export const XaiCheckpointSchema = z.object({
  name: z.string(),
  status: z.enum(['PASS', 'FAIL', 'WARN']),
  rationale: z.string(),
});
export type XaiCheckpoint = z.infer<typeof XaiCheckpointSchema>;

// XAI Rule Path
export const XaiRulePathSchema = z.object({
  agreement: z.string(),
  rule: z.enum(['CTH', 'CTSH', 'VA', 'WO', 'CC']),
  checkpoints: z.array(XaiCheckpointSchema),
});
export type XaiRulePath = z.infer<typeof XaiRulePathSchema>;

// XAI Result Explanation
export const XaiResultExplanationSchema = z.object({
  assessmentId: z.string().uuid(),
  verdict: VerdictSchema,
  summary: z.string(),
  rulePath: XaiRulePathSchema,
  chainClosure: z.object({
    coveragePercent: z.number(),
    missingNodes: z.array(z.string()),
  }),
  dataInputs: z.object({
    hsCode: z.string(),
    bomNodes: z.number(),
    cooDocuments: z.number(),
  }),
  trace: z.object({
    traceId: z.string(),
    duration: z.number(), // ms
    confidence: z.number().min(0).max(1).optional(),
  }),
});
export type XaiResultExplanation = z.infer<typeof XaiResultExplanationSchema>;
