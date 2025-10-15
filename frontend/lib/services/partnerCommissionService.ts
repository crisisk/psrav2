import { z } from 'zod';

// Type definitions
interface CommissionParams {
  partnerId: string;
  startDate: Date;
  endDate: Date;
  salesAmount: number;
}

export async function calculateCommissions(params: CommissionParams): Promise<number> {
  // Validate input parameters
  try {
    // Validate partner ID format
    z.string().uuid().parse(params.partnerId);
    
    // Validate date range
    if (params.startDate >= params.endDate) {
      throw new Error('Invalid date range');
    }

    // Validate sales amount
    if (params.salesAmount <= 0) {
      throw new Error('Sales amount must be positive');
    }

    // Business logic: 15% commission rate
    // Note: In real implementation this would fetch partner-specific rates from database
    const commissionRate = 0.15;
    const commission = params.salesAmount * commissionRate;

    // Ensure commission is rounded to 2 decimal places
    return Math.round(commission * 100) / 100;

  } catch (error) {
    console.error('[COMMISSION_CALCULATION_ERROR]', error);
    throw new Error('Commission calculation failed');
  }
}
