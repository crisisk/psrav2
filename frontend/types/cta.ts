/**
 * CTA Mapping types
 */

export interface CtaMapping {
  id: string;
  category: string;
  target: string;
  status: 'compliant' | 'pending' | 'non-compliant';
  [key: string]: any;
}

export interface ErrorResponse {
  error: string;
  [key: string]: any;
}

export default {
  CtaMapping,
  ErrorResponse
};
