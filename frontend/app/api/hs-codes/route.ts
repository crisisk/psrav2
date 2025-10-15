import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mockHsCodes } from '@/lib/mock-data';
import { fetchTaricCommodity, searchTaricCommodities } from '@/lib/taric-client';
import { cacheService } from '@/lib/cache-service';
import { isDatabaseEnabled } from '@/lib/config';

type HsCodeResponse = {
  hsCodes: Array<{ code: string; description: string; chapter: string; section?: string }>;
  total: number;
  source: 'database' | 'taric' | 'mock';
};

const buildCacheKey = (search: string | null, chapter: string | null) =>
  JSON.stringify({
    search: search ? search.toLowerCase() : null,
    chapter: chapter ? chapter.toLowerCase() : null,
  });

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawSearch = searchParams.get('search');
  const rawChapter = searchParams.get('chapter');

  const search = rawSearch?.trim() ? rawSearch.trim() : null;
  const chapter = rawChapter?.trim() ? rawChapter.trim() : null;
  const cacheKey = buildCacheKey(search, chapter);

  const cached = await (cacheService as any).getCachedHsCodes?.(cacheKey);
  if (cached) {
    const cachedResponse = NextResponse.json(cached);
    cachedResponse.headers.set('x-cache', 'hit');
    return cachedResponse;
  }

  let responsePayload: HsCodeResponse | null = null;

  if (isDatabaseEnabled()) {
    try {
      let sql = 'SELECT code, description, chapter, section FROM hs_codes';
      const params: any[] = [];
      const conditions: string[] = [];

      if (search) {
        conditions.push(`(code ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }

      if (chapter) {
        conditions.push(`chapter = $${params.length + 1}`);
        params.push(chapter);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY code ASC LIMIT 100';

      const result = await query(sql, params);
      const rows = result.rows || [];

      if (rows.length > 0) {
        responsePayload = {
          hsCodes: rows,
          total: rows.length,
          source: 'database',
        };
      }
    } catch (error) {
      console.error('Error fetching HS codes from database:', error);
    }
  }

  if (!responsePayload) {
    const taricFallback = await resolveTaricFallback(search, chapter);
    if (taricFallback) {
      responsePayload = taricFallback;
    }
  }

  if (!responsePayload) {
    const filtered = mockHsCodes.filter((entry) => matchesFilters(entry, search, chapter));
    responsePayload = {
      hsCodes: filtered,
      total: filtered.length,
      source: 'mock',
    };
  }

  await cacheService.cacheHsCodes(cacheKey, responsePayload);

  const response = NextResponse.json(responsePayload);
  response.headers.set('x-cache', 'miss');
  return response;
}

function matchesFilters(entry: { code: string; description: string; chapter: string }, search: string | null, chapter: string | null) {
  if (search) {
    const normalized = search.toLowerCase();
    const matchesCode = entry.code.includes(normalized);
    const matchesDescription = entry.description.toLowerCase().includes(normalized);
    if (!matchesCode && !matchesDescription) {
      return false;
    }
  }

  if (chapter && entry.chapter !== chapter) {
    return false;
  }

  return true;
}

async function resolveTaricFallback(search: string | null, chapter: string | null): Promise<HsCodeResponse | null> {
  const taricResults: any = search
    ? await searchTaricCommodities(search)
    : chapter
    ? await searchTaricCommodities(chapter)
    : null;

  if (taricResults?.commodities?.length) {
    const hsCodes = taricResults.commodities
      .filter((commodity: any) => (chapter ? commodity.code.startsWith(chapter) : true))
      .map((commodity: any) => ({
        code: commodity.code,
        description: commodity.description,
        chapter: commodity.chapter ?? commodity.code.slice(0, 2),
        section: commodity.section,
      }));

    if (hsCodes.length > 0) {
      return {
        hsCodes,
        total: hsCodes.length,
        source: 'taric',
      } as HsCodeResponse;
    }
  }

  if (search && /^\d{4,10}$/.test(search)) {
    const commodity = await fetchTaricCommodity(search);
    if (commodity) {
      return {
        hsCodes: [
          {
            code: commodity.code,
            description: commodity.description,
            chapter: commodity.chapter ?? commodity.code.slice(0, 2),
            section: commodity.section,
          },
        ],
        total: 1,
        source: 'taric',
      } as HsCodeResponse;
    }
  }

  return null;
}
