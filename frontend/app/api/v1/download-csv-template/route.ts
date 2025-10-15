import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Define the CSV template content
    const csvTemplate = `column1,column2,column3\nvalue1,value2,value3`; // Replace with your actual template

    // Set the headers for the response
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="template.csv"');

    // Return the CSV template as a response
    return new NextResponse(csvTemplate, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}