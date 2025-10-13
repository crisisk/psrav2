import { z } from 'zod';

type ProviderInput = {
  id: string;
  name?: string;
  type?: string;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  defaultTemperature?: number;
};

const parseBoolean = (value: string | undefined, fallback = false) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  switch (value.toLowerCase().trim()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      return fallback;
  }
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseProviderConfig = (): ProviderInput[] => {
  const providers: ProviderInput[] = [];

  if (process.env.AI_PROVIDER_CONFIG) {
    try {
      const parsed = JSON.parse(process.env.AI_PROVIDER_CONFIG);
      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (Array.isArray(parsed?.providers)) {
        return parsed.providers as ProviderInput[];
      }
    } catch (error) {
      console.warn('Unable to parse AI_PROVIDER_CONFIG, falling back to environment defaults:', error);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    providers.push({
      id: 'openai-primary',
      name: 'OpenAI GPT-4.1',
      type: 'openai',
      baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      apiKey: process.env.OPENAI_API_KEY,
      defaultTemperature: parseNumber(process.env.OPENAI_TEMPERATURE, 0.2),
    });
  }

  if (process.env.ANTHROPIC_API_KEY) {
    providers.push({
      id: 'anthropic-claude',
      name: 'Anthropic Claude 3.5',
      type: 'anthropic',
      baseUrl: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com/v1/messages',
      model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultTemperature: parseNumber(process.env.ANTHROPIC_TEMPERATURE, 0.2),
    });
  }

  if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_ENDPOINT) {
    providers.push({
      id: 'azure-openai',
      name: 'Azure OpenAI',
      type: 'azure_openai',
      baseUrl: process.env.AZURE_OPENAI_ENDPOINT,
      model: process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o-mini',
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      defaultTemperature: parseNumber(process.env.AZURE_OPENAI_TEMPERATURE, 0.2),
    });
  }

  if (providers.length === 0) {
    providers.push({
      id: 'deterministic-fallback',
      name: 'Deterministic Fallback',
      type: 'http',
      baseUrl: process.env.AI_FALLBACK_ENDPOINT,
      model: 'deterministic-rule-check',
    });
  }

  return providers;
};

const rawConfig = {
  databaseUrl: process.env.DATABASE_URL,
  taricApiBase: process.env.TARIC_API_BASE,
  redisUrl: process.env.REDIS_URL,
  enableRedisCache: parseBoolean(process.env.ENABLE_REDIS_CACHE, Boolean(process.env.REDIS_URL)),
  enableTaskQueue: parseBoolean(process.env.ENABLE_TASK_QUEUE),
  enableAuditLogs: parseBoolean(process.env.ENABLE_AUDIT_LOGS),
  enableNotifications: parseBoolean(process.env.ENABLE_SMTP_NOTIFICATIONS),
  pgSsl: parseBoolean(process.env.PGSSL),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  ltsdServiceUrl: process.env.LTSD_SERVICE_URL,
  ltsdServiceTimeoutMs: parseNumber(process.env.LTSD_SERVICE_TIMEOUT_MS, 10000),
};

const rawAiConfig = {
  consensusEnabled: parseBoolean(process.env.AI_CONSENSUS_ENABLED, true),
  hitlEnabled: parseBoolean(process.env.AI_HITL_ENABLED, true),
  consensusThreshold: Math.min(Math.max(parseNumber(process.env.AI_CONSENSUS_THRESHOLD, 0.75), 0), 1),
  hitlThreshold: Math.min(Math.max(parseNumber(process.env.AI_HITL_THRESHOLD, 0.6), 0), 1),
  providerTimeoutMs: Math.min(Math.max(parseNumber(process.env.AI_PROVIDER_TIMEOUT_MS, 12000), 1000), 60000),
  providerRetries: Math.min(Math.max(parseNumber(process.env.AI_PROVIDER_RETRIES, 1), 0), 5),
  providers: parseProviderConfig(),
};

const configSchema = z.object({
  databaseUrl: z.string().optional(),
  taricApiBase: z.string().optional(),
  redisUrl: z.string().optional(),
  enableRedisCache: z.boolean(),
  enableTaskQueue: z.boolean(),
  enableAuditLogs: z.boolean(),
  enableNotifications: z.boolean(),
  pgSsl: z.boolean(),
  ltsdServiceUrl: z.string().url().optional(),
  ltsdServiceTimeoutMs: z.number().min(1000).max(60000),
  smtp: z.object({
    host: z.string().optional(),
    port: z.number().optional(),
    user: z.string().optional(),
    pass: z.string().optional(),
    from: z.string().default('noreply@sevensa.nl'),
  }),
  ai: z.object({
    consensusEnabled: z.boolean(),
    hitlEnabled: z.boolean(),
    consensusThreshold: z.number().min(0).max(1),
    hitlThreshold: z.number().min(0).max(1),
    providerTimeoutMs: z.number().min(1000).max(60000),
    providerRetries: z.number().min(0).max(5),
    providers: z
      .array(
        z.object({
          id: z.string(),
          name: z.string().default(''),
          type: z.enum(['openai', 'anthropic', 'azure_openai', 'vertex', 'http']).default('http'),
          baseUrl: z.string().optional(),
          model: z.string().optional(),
          apiKey: z.string().optional(),
          defaultTemperature: z.number().optional(),
        })
      )
      .default([]),
  }),
});

const parsed = configSchema.parse({
  ...rawConfig,
  smtp: {
    host: rawConfig.smtpHost,
    port: rawConfig.smtpPort,
    user: rawConfig.smtpUser,
    pass: rawConfig.smtpPass,
    from: rawConfig.smtpFrom ?? 'noreply@sevensa.nl',
  },
  ai: rawAiConfig,
});

export const config = parsed;

export type AppConfig = typeof config;

export const isDatabaseEnabled = Boolean(config.databaseUrl);
export const isRedisEnabled = config.enableRedisCache && Boolean(config.redisUrl);
export const isTaskQueueEnabled = config.enableTaskQueue && isRedisEnabled;
export const isAuditLogEnabled = config.enableAuditLogs && isDatabaseEnabled;
export const isNotificationEnabled =
  config.enableNotifications && Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
export const aiConfig = config.ai;
export const isAiConsensusEnabled = aiConfig.consensusEnabled && aiConfig.providers.length > 0;
export const isAiHitlEnabled = aiConfig.hitlEnabled;
export const isLtsdServiceConfigured = Boolean(config.ltsdServiceUrl);
