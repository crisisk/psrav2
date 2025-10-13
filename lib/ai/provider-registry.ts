import { aiConfig } from '../config';
import type { LLMProviderConfig } from './types';

export const getConfiguredProviders = (): LLMProviderConfig[] =>
  aiConfig.providers.map((provider) => ({
    id: provider.id,
    name: provider.name ?? provider.id,
    type: provider.type,
    baseUrl: provider.baseUrl,
    model: provider.model,
    apiKey: provider.apiKey,
    defaultTemperature: provider.defaultTemperature,
  }));

export const getActiveProviders = (): LLMProviderConfig[] =>
  getConfiguredProviders().filter((provider) => {
    if (provider.type === 'http') {
      return Boolean(provider.baseUrl);
    }

    return Boolean(provider.apiKey && provider.model && provider.baseUrl);
  });
