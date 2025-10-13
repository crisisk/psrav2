import { evaluateRequestSchema, evaluateResponseSchema, generateCertificateRequestSchema, type EvaluateRequestPayload, type EvaluateResponsePayload, type GenerateCertificateRequestPayload } from '@/lib/integrations/ltsd-contracts';
import { config } from '@/lib/config';

type FetchOptions = {
  path: string;
  method: 'POST';
  body: string;
  headers?: Record<string, string>;
};

export class LtsdServiceError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'LtsdServiceError';
    this.status = status;
    this.details = details;
  }
}

const ensureBaseUrl = (): string => {
  const baseUrl = config.ltsdServiceUrl;
  if (!baseUrl) {
    throw new LtsdServiceError('LTSD service base URL is not configured', 503);
  }
  return baseUrl.replace(/\/$/, '');
};

const requestTimeoutMs = (): number => {
  const timeout = config.ltsdServiceTimeoutMs ?? 10000;
  return Math.min(Math.max(timeout, 1000), 60000);
};

const callLtsd = async ({ path, method, body, headers }: FetchOptions): Promise<Response> => {
  const baseUrl = ensureBaseUrl();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), requestTimeoutMs());

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      body,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      let details: unknown;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          details = await response.clone().json();
        } catch (error) {
          details = { error: 'Failed to parse LTSD error payload', cause: error instanceof Error ? error.message : error };
        }
      } else {
        details = await response.text();
      }

      const message =
        typeof details === 'object' && details !== null && 'detail' in details
          ? String((details as Record<string, unknown>).detail)
          : 'LTSD service responded with an error';

      throw new LtsdServiceError(message, response.status, details);
    }

    return response;
  } catch (error) {
    if (error instanceof LtsdServiceError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new LtsdServiceError('LTSD service request timed out', 504);
    }

    throw new LtsdServiceError(
      'Failed to reach LTSD service',
      503,
      error instanceof Error ? error.message : String(error)
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
};

export const evaluateLtsd = async (payload: EvaluateRequestPayload): Promise<EvaluateResponsePayload> => {
  const validated = evaluateRequestSchema.parse(payload);
  const response = await callLtsd({ path: '/evaluate', method: 'POST', body: JSON.stringify(validated) });
  const data = await response.json();
  return evaluateResponseSchema.parse(data);
};

export const generateLtsdCertificate = async (
  payload: GenerateCertificateRequestPayload
): Promise<Response> => {
  const validated = generateCertificateRequestSchema.parse(payload);
  return callLtsd({ path: '/generate', method: 'POST', body: JSON.stringify(validated) });
};
