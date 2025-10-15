import { NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/db'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty')
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate request body
    const validation = searchSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { status: 'error', message: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { query } = validation.data

    // Full-text search using PostgreSQL tsvector
    const result = await pool.query(
      `SELECT 
        id, 
        title, 
        content,
        issued_to,
        issued_at,
        ts_headline(content, websearch_to_tsquery($1)) as content_highlight
       FROM certificates
       WHERE 
        to_tsvector('english', title || ' ' || content) @@ websearch_to_tsquery($1)
       ORDER BY issued_at DESC
       LIMIT 50`,
      [query]
    )

    return NextResponse.json({
      status: 'success',
      data: result.rows
    })

  } catch (error) {
    console.error('[CertificatesSearchError]', error)
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
