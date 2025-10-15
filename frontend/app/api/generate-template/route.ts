import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';

type RequestBody = {
  productName: string;
  provider: string;
  riskCategory: string;
  assessmentDate: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // Validate required fields
    if (!body.productName || !body.provider || !body.riskCategory || !body.assessmentDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Word document structure
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'EU AI Act Conformity Assessment',
                bold: true,
                size: 28,
              }),
            ],
            alignment: 'center',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Product Name: ',
                bold: true,
              }),
              new TextRun(body.productName),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Provider: ',
                bold: true,
              }),
              new TextRun(body.provider),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Risk Category: ',
                bold: true,
              }),
              new TextRun(body.riskCategory),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Assessment Date: ',
                bold: true,
              }),
              new TextRun(body.assessmentDate),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'This document certifies compliance with the EU Artificial Intelligence Act (2024) regulations.',
            alignment: 'center',
          }),
        ],
      }],
    });

    // Generate Word buffer
    const buffer = await Packer.toBuffer(doc);

    // Create response with Word document
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="conformity-assessment-${body.productName}.docx"`,
      },
    });
  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}
