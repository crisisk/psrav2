export interface AuditLog {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  timestamp: Date;
  duration?: number;  // Duration in milliseconds
  success?: boolean;  // Whether the action was successful
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  // Mock data - replace with actual database call in production
  return [
    {
      id: '1',
      customerId: 'CUST-001',
      customerName: 'Acme Corp',
      amount: 1500,
      timestamp: new Date('2024-01-15'),
      duration: 150,
      success: true,
    },
    {
      id: '2',
      customerId: 'CUST-002',
      customerName: 'Globex Inc',
      amount: 2345,
      timestamp: new Date('2024-01-16'),
      duration: 230,
      success: true,
    },
    {
      id: '3',
      customerId: 'CUST-001',
      customerName: 'Acme Corp',
      amount: 899,
      timestamp: new Date('2024-01-17'),
      duration: 180,
      success: true,
    },
  ];
}
