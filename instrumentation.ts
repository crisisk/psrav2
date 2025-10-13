import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { registerOTel } from '@vercel/otel';

const DEFAULT_SERVICE_NAME = 'psra-origin-checker';

function getServiceName(): string {
  const override = process.env.OTEL_SERVICE_NAME ?? process.env.NEXT_RUNTIME_SERVICE_NAME;
  if (!override) {
    return DEFAULT_SERVICE_NAME;
  }
  return override.trim() || DEFAULT_SERVICE_NAME;
}

export function register(): void {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  registerOTel({
    serviceName: getServiceName(),
    instrumentationConfig: {
      fetch: {
        ignoreUrls: [
          /\/health$/,
          /\/metrics$/,
        ],
      },
    },
  });
}
