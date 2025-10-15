import { NextResponse, NextRequest } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(req: NextRequest) {
  try {
    // Initialize workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    // Define column headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Action', key: 'action', width: 30 },
      { header: 'Timestamp', key: 'timestamp', width: 25 },
      { header: 'User ID', key: 'userId', width: 20 },
      { header: 'IP Address', key: 'ipAddress', width: 15 }
    ];

    // Add sample data (replace with actual data source in production)
    const mockData = [
      {
        id: 1,
        action: 'user_login',
        timestamp: new Date(),
        userId: 'usr_123',
        ipAddress: '192.168.1.1'
      },
      {
        id: 2,
        action: 'file_download',
        timestamp: new Date(),
        userId: 'usr_456',
        ipAddress: '10.0.0.1'
      }
    ];

    worksheet.addRows(mockData);

    // Generate Excel buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create response with Excel file
    return new NextResponse(buffer, {
      headers: new Headers({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=audit_logs.xlsx'
      })
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit log export' },
      { status: 500 }
    );
  }
}
