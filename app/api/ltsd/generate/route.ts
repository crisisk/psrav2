import { NextRequest, NextResponse } from 'next/server'
import { mkdir } from 'fs/promises'
import path from 'path'

// Types
interface GenerateRequestBody {
  assessmentIds: string[]
  metadata: Record<string, any>
}

// Constants
const MOCK_PDF_PATH = path.join(process.cwd(), 'public', 'mock', 'sample.pdf')
const API_ENDPOINT = `${process.env.API_BASE_URL}/ltsd/generate`

// Helper to check if we should use mock data
const shouldUseMock = () => {
  return process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'
}

// Helper to proxy request to backend
async function proxyRequest(url: string, data: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`)
  }

  return response
}

// Create directory if it doesn't exist
try {
  await mkdir(path.dirname(MOCK_PDF_PATH), { recursive: true })
} catch (error) {
  console.error('Error creating directory:', error)
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequestBody = await request.json()

    let pdfBlob: Blob

    if (shouldUseMock()) {
      // Return mock PDF
      const mockPdfResponse = await fetch('file://' + MOCK_PDF_PATH)
      pdfBlob = await mockPdfResponse.blob()
    } else {
      // Proxy to backend
      const response = await proxyRequest(API_ENDPOINT, body)
      pdfBlob = await response.blob()
    }

    // Set response headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', 'attachment; filename="ltsd-report.pdf"')

    return new NextResponse(pdfBlob, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error('Error generating LTSD:', error)
    return NextResponse.json(
      { error: 'Failed to generate LTSD report' },
      { status: 500 }
    )
  }
}