import { cache } from 'react';

const DEFAULT_TARIC_BASE = 'https://ec.europa.eu/taxation_customs/dds2/taric/api';

export interface TaricCommodity {
  code: string;
  description: string;
  section?: string;
  chapter?: string;
}

export interface TaricSearchResult {
  commodities: TaricCommodity[];
  source: 'taric';
}

const buildUrl = (path: string, base?: string) => {
  const taricBase = (base || process.env.TARIC_API_BASE || DEFAULT_TARIC_BASE).replace(/\/$/, '');
  return `${taricBase}${path.startsWith('/') ? '' : '/'}${path}`;
};

const requestJson = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`TARIC request failed (${response.status}): ${url}`);
      return null;
    }

    const payload = (await response.json()) as T;
    return payload;
  } catch (error) {
    console.warn('Unable to reach TARIC API', error);
    return null;
  }
};

export const fetchTaricCommodity = cache(async (code: string, base?: string): Promise<TaricCommodity | null> => {
  const normalizedCode = code.replace(/\D/g, '').slice(0, 10);
  if (normalizedCode.length < 4) {
    return null;
  }

  const data = await requestJson<any>(buildUrl(`/commodities/${normalizedCode}`, base));
  if (!data) {
    return null;
  }

  const commodity = Array.isArray(data?.commodities) ? data.commodities[0] : data;
  if (!commodity) {
    return null;
  }

  return {
    code: commodity.code || normalizedCode,
    description: commodity.description || commodity.goods_nomenclature_item_description || '',
    section: commodity.section,
    chapter: commodity.chapter,
  };
});

export const searchTaricCommodities = cache(async (query: string): Promise<TaricSearchResult | null> => {
  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) {
    return null;
  }

  const path = /^\d{4,10}$/.test(sanitizedQuery)
    ? `/commodities/${sanitizedQuery}`
    : `/commodities/search?keywords=${encodeURIComponent(sanitizedQuery)}`;

  const data = await requestJson<any>(buildUrl(path));
  if (!data) {
    return null;
  }

  const commodities: TaricCommodity[] = Array.isArray(data?.commodities)
    ? data.commodities.map((entry: any) => ({
        code: entry.code,
        description: entry.description || entry.goods_nomenclature_item_description,
        section: entry.section,
        chapter: entry.chapter,
      }))
    : data?.code
    ? [
        {
          code: data.code,
          description: data.description || data.goods_nomenclature_item_description,
          section: data.section,
          chapter: data.chapter,
        },
      ]
    : [];

  if (commodities.length === 0) {
    return null;
  }

  return { commodities, source: 'taric' };
});
