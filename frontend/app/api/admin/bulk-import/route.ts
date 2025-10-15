import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import csv from 'csv-parser';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    if (!importType || !['hs_codes', 'certificates', 'origin_rules'].includes(importType)) {
      return NextResponse.json(
        { error: 'Invalid import type. Must be: hs_codes, certificates, or origin_rules' },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
    
    let importedCount = 0;
    let errors: string[] = [];
    
    // Parse CSV and import data
    const results = await new Promise<any[]>((resolve, reject) => {
      const rows: any[] = [];
      
      stream
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', () => resolve(rows))
        .on('error', reject);
    });
    
    // Process each row based on import type
    for (const row of results) {
      try {
        switch (importType) {
          case 'hs_codes':
            await importHsCode(row);
            break;
          case 'certificates':
            await importCertificate(row);
            break;
          case 'origin_rules':
            await importOriginRule(row);
            break;
        }
        importedCount++;
      } catch (error) {
        errors.push(`Row ${importedCount + 1}: ${error}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      imported: importedCount,
      total: results.length,
      errors: errors.slice(0, 10) // Limit error messages
    });
    
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}

async function importHsCode(row: any) {
  const { code, description, chapter, section } = row;
  
  if (!code || !description) {
    throw new Error('Missing required fields: code, description');
  }
  
  await query(`
    INSERT INTO hs_codes (id, code, description, chapter, section, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET
      description = EXCLUDED.description,
      chapter = EXCLUDED.chapter,
      section = EXCLUDED.section,
      "updatedAt" = NOW()
  `, [code, description, chapter || '', section || '']);
}

async function importCertificate(row: any) {
  const { productSku, hsCode, agreement, status, result } = row;
  
  if (!productSku || !hsCode || !agreement) {
    throw new Error('Missing required fields: productSku, hsCode, agreement');
  }
  
  const resultJson = result ? JSON.parse(result) : null;
  
  await query(`
    INSERT INTO certificates (id, "productSku", hs6, agreement, status, result, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
  `, [productSku, hsCode, agreement, status || 'pending', resultJson]);
}

async function importOriginRule(row: any) {
  const { hsCode, tradeAgreement, ruleText, conditions } = row;
  
  if (!hsCode || !tradeAgreement || !ruleText) {
    throw new Error('Missing required fields: hsCode, tradeAgreement, ruleText');
  }
  
  const conditionsJson = conditions ? JSON.parse(conditions) : {};
  
  await query(`
    INSERT INTO origin_rules (id, "hsCode", "tradeAgreement", "ruleText", conditions, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
  `, [hsCode, tradeAgreement, ruleText, conditionsJson]);
}
