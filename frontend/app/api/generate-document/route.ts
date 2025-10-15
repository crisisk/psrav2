import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface RequestBody {
  prompt: string;
}

interface SuccessResponse {
  content: string;
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: Request) {
  // Validate OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json<ErrorResponse>({
      error: 'OpenAI API key not configured'
    }, { status: 500 });
  }

  // Validate request method
  if (request.method !== 'POST') {
    return NextResponse.json<ErrorResponse>({
      error: 'Method not allowed'
    }, { status: 405 });
  }

  try {
    // Parse and validate request body
    const body: RequestBody = await request.json();
    if (!body.prompt?.trim()) {
      return NextResponse.json<ErrorResponse>({
        error: 'Prompt is required'
      }, { status: 400 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Generate document content
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Generate a structured document based on this prompt: ${body.prompt}`
      }],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Validate and return response
    const content = completion.choices[0].message.content?.trim();
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return NextResponse.json<SuccessResponse>({ content });

  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json<ErrorResponse>({
      error: error instanceof Error ? error.message : 'Document generation failed'
    }, { status: 500 });
  }
}
