import { z } from "zod";

export const CoOStatus = z.enum(["RECEIVED","VALIDATING","VALID","EXPIRED","REJECTED"]);
export const ChainStatus = z.enum(["INCOMPLETE","PENDING_REVIEW","COMPLETE"]);

export const CertificateOfOrigin = z.object({
  id: z.string(),
  supplierId: z.string(),
  issuer: z.string(),
  hsCode: z.string(),
  materialName: z.string(),
  countryOfOrigin: z.string(),
  validFrom: z.string(),
  validTo: z.string(),
  agreement: z.string().optional(),
  coveragePct: z.number().min(0).max(100).default(100),
  fileUrl: z.string().url(),
  status: CoOStatus.default("RECEIVED"),
  uploadedAt: z.string(),
  checksum: z.string().optional(),
  notes: z.string().optional(),
});
export type TCertificateOfOrigin = z.infer<typeof CertificateOfOrigin>;

export const BomNode: any = z.lazy(() => z.object({
  id: z.string(),
  hsCode: z.string(),
  materialName: z.string(),
  quantity: z.number().nullable().optional(),
  children: z.array(BomNode).optional(),
  certificates: z.array(CertificateOfOrigin).default([]),
  completeness: z.number().min(0).max(100).default(0),
  status: CoOStatus.default("RECEIVED"),
}));
export type TBomNode = z.infer<typeof BomNode>;

export const ChainGraph = z.object({
  ltsdId: z.string(),
  rootHs: z.string(),
  agreement: z.string(),
  nodes: z.array(BomNode),
  status: ChainStatus,
  missingCount: z.number(),
  coveragePct: z.number()
});

export const AuditEvent = z.object({
  id: z.string(),
  type: z.enum(["COO_UPLOADED","COO_VALIDATED","COO_REJECTED","COO_EXPIRED","NODE_COMPLETENESS_UPDATED","CHAIN_STATUS_UPDATED","COO_REQUESTED"]),
  actor: z.object({ id: z.string(), role: z.string(), email: z.string().email().optional() }),
  ltsdId: z.string(),
  nodeId: z.string().optional(),
  cooId: z.string().optional(),
  timestamp: z.string(),
  details: z.record(z.any()).optional(),
  hash: z.string().optional(),
});
export const AuditTrail = z.object({ ltsdId: z.string(), events: z.array(AuditEvent) });
