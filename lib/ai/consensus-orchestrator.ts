import { setTimeout as delay } from 'timers/promises';

import { auditService } from '../audit-service';
import { aiConfig, isAiConsensusEnabled, isAiHitlEnabled } from '../config';
import { getActiveProviders } from './provider-registry';
import type {
  ConsensusInput,
  ConsensusOutcome,
  ProviderCallResult,
  ProviderCallSuccess,
  RuleEvaluationSummary,
} from './types';
import type { LLMProviderConfig } from './types';

const NORMALISED_MIN_CONFIDENCE = 0.05;

const buildPrompt = (input: ConsensusInput): string => {
  const header = `You are part of a regulatory compliance council. Review the preferential origin outcome for product ${input.request.productSku} using HS ${input.request.hsCode} under ${input.request.tradeAgreement}.`;

  const materials = input.request.materials
    .map(
      (material) =>
        `- HS ${material.hsCode} from ${material.origin} contributing ${material.percentage.toFixed(2)}% (${material.value.toFixed(2)} value)`
    )
    .join('\n');

  const evaluations = input.evaluations
    .map(
      (evaluation) =>
        `• Rule ${evaluation.ruleId}: ${evaluation.isConform ? 'CONFORM' : 'NOT CONFORM'} @ ${(evaluation.confidence * 100).toFixed(1)}% – ${evaluation.explanation}`
    )
    .join('\n');

  const baseline = `Current engine decision: ${input.bestResult.isConform ? 'CONFORM' : 'NOT CONFORM'} (confidence ${(input.bestResult.confidence * 100).toFixed(1)}%).`;

  return `${header}\n\nMaterials:\n${materials}\n\nRule evaluations:\n${evaluations}\n\n${baseline}\n\nRespond in JSON with keys decision (conform|non-conform|inconclusive), confidence (0-1), rationale (short explanation).`;
};

const parseDecision = (content: string): ProviderCallSuccess['decision'] => {
  const normalised = content.toLowerCase();
  if (normalised.includes('non-conform')) {
    return 'non-conform';
  }
  if (normalised.includes('conform')) {
    return 'conform';
  }
  return 'inconclusive';
};

const parseConfidence = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return Math.min(Math.max(numeric, NORMALISED_MIN_CONFIDENCE), 1);
  }
  return fallback;
};

const normaliseSuccess = (
  provider: LLMProviderConfig,
  raw: any,
  elapsedMs: number
): ProviderCallSuccess => {
  if (!raw) {
    return {
      status: 'ok',
      providerId: provider.id,
      providerName: provider.name,
      decision: 'inconclusive',
      confidence: NORMALISED_MIN_CONFIDENCE,
      rationale: 'Empty response',
      rawResponse: raw,
      latencyMs: elapsedMs,
    };
  }

  if (typeof raw === 'string') {
    return {
      status: 'ok',
      providerId: provider.id,
      providerName: provider.name,
      decision: parseDecision(raw),
      confidence: NORMALISED_MIN_CONFIDENCE,
      rationale: raw.slice(0, 500),
      rawResponse: raw,
      latencyMs: elapsedMs,
    };
  }

  const structured = typeof raw === 'object' ? raw : { content: String(raw) };
  const decision = parseDecision(
    structured.decision ?? structured.result ?? structured.choice ?? structured.content ?? ''
  );
  const confidence = parseConfidence(structured.confidence ?? structured.score, NORMALISED_MIN_CONFIDENCE);
  const rationale =
    structured.rationale ?? structured.reason ?? structured.explanation ?? JSON.stringify(structured).slice(0, 500);

  return {
    status: 'ok',
    providerId: provider.id,
    providerName: provider.name,
    decision,
    confidence,
    rationale,
    rawResponse: raw,
    latencyMs: elapsedMs,
  };
};

const buildOpenAiRequest = (provider: LLMProviderConfig, prompt: string) => {
  const url = `${provider.baseUrl?.replace(/\/$/, '')}/chat/completions`;
  const headers = {
    Authorization: `Bearer ${provider.apiKey}`,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    model: provider.model,
    temperature: provider.defaultTemperature ?? 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an expert customs compliance analyst.' },
      { role: 'user', content: prompt },
    ],
  });
  return { url, headers, body };
};

const buildAnthropicRequest = (provider: LLMProviderConfig, prompt: string) => {
  const url = provider.baseUrl ?? 'https://api.anthropic.com/v1/messages';
  const headers = {
    'x-api-key': provider.apiKey ?? '',
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    model: provider.model,
    max_tokens: 512,
    temperature: provider.defaultTemperature ?? 0.2,
    system: 'You are an expert customs compliance analyst.',
    messages: [{ role: 'user', content: prompt }],
  });
  return { url, headers, body };
};

const buildAzureOpenAiRequest = (provider: LLMProviderConfig, prompt: string) => {
  const version = process.env.AZURE_OPENAI_API_VERSION ?? '2024-02-15-preview';
  const baseUrl = provider.baseUrl?.replace(/\/$/, '') ?? '';
  const url = `${baseUrl}/openai/deployments/${provider.model}/chat/completions?api-version=${version}`;
  const headers = {
    'api-key': provider.apiKey ?? '',
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({
    temperature: provider.defaultTemperature ?? 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an expert customs compliance analyst.' },
      { role: 'user', content: prompt },
    ],
  });
  return { url, headers, body };
};

const buildHttpRequest = (provider: LLMProviderConfig, prompt: string) => {
  const url = provider.baseUrl ?? '';
  const headers = {
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({ prompt, model: provider.model, provider: provider.id });
  return { url, headers, body };
};

const callProvider = async (provider: LLMProviderConfig, prompt: string): Promise<ProviderCallResult> => {
  if (provider.type !== 'http' && (!provider.apiKey || !provider.model || !provider.baseUrl)) {
    return {
      status: 'skipped',
      providerId: provider.id,
      providerName: provider.name,
      reason: 'Missing API configuration',
    };
  }

  if (provider.type === 'http' && !provider.baseUrl) {
    return {
      status: 'skipped',
      providerId: provider.id,
      providerName: provider.name,
      reason: 'No HTTP endpoint configured',
    };
  }

  const retries = aiConfig.providerRetries;
  let attempt = 0;
  let lastError: ProviderCallResult | null = null;

  while (attempt <= retries) {
    try {
      const { url, headers, body } =
        provider.type === 'openai'
          ? buildOpenAiRequest(provider, prompt)
          : provider.type === 'anthropic'
          ? buildAnthropicRequest(provider, prompt)
          : provider.type === 'azure_openai'
          ? buildAzureOpenAiRequest(provider, prompt)
          : buildHttpRequest(provider, prompt);

      const started = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const json = await response.json().catch(() => response.text());
      const elapsed = Date.now() - started;

      if (provider.type === 'openai' && json?.choices?.[0]?.message?.content) {
        const content = json.choices[0].message.content;
        try {
          const parsed = JSON.parse(content);
          return normaliseSuccess(provider, parsed, elapsed);
        } catch (error) {
          return normaliseSuccess(provider, content, elapsed);
        }
      }

      if (provider.type === 'anthropic' && json?.content?.[0]?.text) {
        const content = json.content[0].text;
        try {
          const parsed = JSON.parse(content);
          return normaliseSuccess(provider, parsed, elapsed);
        } catch (error) {
          return normaliseSuccess(provider, content, elapsed);
        }
      }

      if (provider.type === 'azure_openai' && json?.choices?.[0]?.message?.content) {
        const content = json.choices[0].message.content;
        try {
          const parsed = JSON.parse(content);
          return normaliseSuccess(provider, parsed, elapsed);
        } catch (error) {
          return normaliseSuccess(provider, content, elapsed);
        }
      }

      return normaliseSuccess(provider, json, elapsed);
    } catch (error) {
      lastError = {
        status: 'error',
        providerId: provider.id,
        providerName: provider.name,
        errorMessage: error instanceof Error ? error.message : String(error),
      };

      if (attempt >= retries) {
        return lastError;
      }

      const backoff = Math.min(2 ** attempt * 250, 2000);
      await delay(backoff);
      attempt += 1;
    }
  }

  return lastError ?? {
    status: 'error',
    providerId: provider.id,
    providerName: provider.name,
    errorMessage: 'Unknown provider error',
  };
};

const deriveSyntheticConsensus = (
  input: ConsensusInput,
  evaluations: RuleEvaluationSummary[]
): ConsensusOutcome => {
  const averageConfidence = evaluations.reduce((sum, evaluation) => sum + evaluation.confidence, 0);
  const computedConfidence = evaluations.length > 0 ? averageConfidence / evaluations.length : 0.5;
  const supportiveRules = evaluations.filter((evaluation) => evaluation.isConform).length;
  const dissentingRules = evaluations.length - supportiveRules;
  const majoritySupports = supportiveRules >= dissentingRules;

  const consensusScore = Math.min(Math.max(computedConfidence, NORMALISED_MIN_CONFIDENCE), 1);
  const requiresHumanReview =
    (majoritySupports !== input.bestResult.isConform) || consensusScore < aiConfig.hitlThreshold;

  const dissentingSummaries = evaluations
    .filter((evaluation) => evaluation.isConform !== input.bestResult.isConform)
    .map((evaluation) => `Rule ${evaluation.ruleId}: ${evaluation.explanation}`);

  const consensusSummary = majoritySupports
    ? `Synthetic consensus matches engine decision with ${(consensusScore * 100).toFixed(1)}% confidence.`
    : `Synthetic consensus diverges from engine decision with ${(consensusScore * 100).toFixed(1)}% confidence.`;

  return {
    enabled: false,
    consensusScore,
    consensusSummary,
    dissentingOpinions: dissentingSummaries,
    providerDecisions: [],
    requiresHumanReview,
    auditTrail: {
      consensusScore,
      requiredThreshold: aiConfig.consensusThreshold,
      providerDecisions: [],
      generatedAt: new Date().toISOString(),
    },
  };
};

const computeConsensusOutcome = (
  input: ConsensusInput,
  providerDecisions: ProviderCallResult[]
): ConsensusOutcome => {
  const successes = providerDecisions.filter(
    (decision): decision is ProviderCallSuccess => decision.status === 'ok'
  );

  if (successes.length === 0) {
    return deriveSyntheticConsensus(input, input.evaluations);
  }

  const conformVotes = successes.filter((result) => result.decision === 'conform');
  const nonConformVotes = successes.filter((result) => result.decision === 'non-conform');
  const inconclusiveVotes = successes.filter((result) => result.decision === 'inconclusive');

  const consensusScore = Math.min(
    Math.max(
      successes.reduce((sum, result) => sum + result.confidence, 0) / successes.length,
      NORMALISED_MIN_CONFIDENCE
    ),
    1
  );

  const consensusDecision =
    conformVotes.length > nonConformVotes.length
      ? 'conform'
      : nonConformVotes.length > conformVotes.length
      ? 'non-conform'
      : input.bestResult.isConform
      ? 'conform'
      : 'non-conform';

  const dissentingOpinions = successes
    .filter((result) => result.decision !== consensusDecision)
    .map((result) => `${result.providerName}: ${result.rationale}`);

  const requiresHumanReview =
    (!isAiHitlEnabled ? false : consensusScore < aiConfig.hitlThreshold) ||
    (conformVotes.length > 0 && nonConformVotes.length > 0) ||
    (inconclusiveVotes.length > successes.length / 2);

  const consensusSummary =
    consensusDecision === 'conform'
      ? `Multi-LLM consensus agrees the shipment is conforming with ${(consensusScore * 100).toFixed(1)}% confidence.`
      : `Multi-LLM consensus flags non-conformity with ${(consensusScore * 100).toFixed(1)}% confidence.`;

  return {
    enabled: true,
    consensusScore,
    consensusSummary,
    dissentingOpinions,
    providerDecisions,
    requiresHumanReview,
    auditTrail: {
      consensusScore,
      requiredThreshold: aiConfig.consensusThreshold,
      providerDecisions,
      generatedAt: new Date().toISOString(),
    },
  };
};

export const runMultiModelConsensus = async (input: ConsensusInput): Promise<ConsensusOutcome> => {
  if (!isAiConsensusEnabled) {
    return deriveSyntheticConsensus(input, input.evaluations);
  }

  const providers = getActiveProviders();
  if (providers.length === 0) {
    return deriveSyntheticConsensus(input, input.evaluations);
  }

  const prompt = buildPrompt(input);
  const providerPromises = providers.map((provider) => callProvider(provider, prompt));
  const providerDecisions = await Promise.all(providerPromises);

  const outcome = computeConsensusOutcome(input, providerDecisions);

  try {
    await auditService.logAction({
      action: 'ai_consensus',
      resource: 'origin-calculation',
      resourceId: input.request.productSku,
      details: {
        hsCode: input.request.hsCode,
        tradeAgreement: input.request.tradeAgreement,
        consensus: outcome,
      },
      success: true,
    });
  } catch (error) {
    console.warn('Failed to persist AI consensus audit trail:', error);
  }

  return outcome;
};
