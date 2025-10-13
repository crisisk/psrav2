import { z } from "zod";

export const CfoKpis = z.object({
  savingsMtd: z.number(),
  atRiskCount: z.number(),
  avgDecisionTimeH: z.number(),
  openApprovals: z.number(),
});

export const TrendPoint = z.object({
  date: z.string(),
  pass: z.number(),
  fail: z.number(),
});
export const TrendSeries = z.array(TrendPoint);

export const SavingsByAgreement = z.array(
  z.object({ agreement: z.string(), value: z.number() })
);

export const AtRiskItem = z.object({
  id: z.string(),
  company: z.string(),
  hs: z.string(),
  agreement: z.string(),
  reason: z.string(),
  amount: z.number(),
  eta: z.string().optional(),
});
export const ApprovalItem = z.object({
  id: z.string(),
  title: z.string(),
  requestedBy: z.string(),
  createdAt: z.string(),
  impact: z.string(),
});
export const AtRiskResponse = z.object({ items: z.array(AtRiskItem), total: z.number() });
export const ApprovalsResponse = z.object({ items: z.array(ApprovalItem), total: z.number() });
