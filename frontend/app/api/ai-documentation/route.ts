import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

// Validation schema for request body
const DocumentationRequestSchema = z.object({
  documentationType: z.enum(['technical', 'compliance', 'process']),
  content: z.string().min(10, 'Content must be at least 10 characters')
});

export async function POST(request: NextRequest) {
  try {
    // Verify API key exists
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = DocumentationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { documentationType, content } = validation.data;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Generate AI documentation
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `Generate ${documentationType} documentation for: ${content}`
      }],
      temperature: 0.7,
      max_tokens: 1000
    });

    return NextResponse.json({
      documentation: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('AI Documentation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate documentation' },
      { status: 500 }
    );
  }
}
