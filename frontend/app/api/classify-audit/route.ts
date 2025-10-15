import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Type definitions for audit log classification
interface AuditLogData {
  timestamp: string;
  userId: string;
  actionType: string;
  resource: string;
  statusCode: number;
  ipAddress?: string;
}

interface ClassificationResult {
  prediction: 'normal' | 'suspicious' | 'critical';
  confidence: number;
  probabilities: {
    normal: number;
    suspicious: number;
    critical: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const logData: AuditLogData = await request.json();

    // Validate input data
    if (!logData.timestamp || !logData.userId || !logData.actionType || !logData.resource || !logData.statusCode) {
      return NextResponse.json(
        { error: 'Missing required fields in audit log data' },
        { status: 400 }
      );
    }

    // Simulate Random Forest classification (production would use actual trained model)
    // In real implementation, this would load the trained model and make prediction
    const mockClassification: ClassificationResult = {
      prediction: Math.random() > 0.7 ? 'critical' : Math.random() > 0.4 ? 'suspicious' : 'normal',
      confidence: Math.random(),
      probabilities: {
        normal: Math.random(),
        suspicious: Math.random(),
        critical: Math.random(),
      },
    };

    // Normalize probabilities to sum to 1
    const total = Object.values(mockClassification.probabilities).reduce((sum, val) => sum + val, 0);
    Object.keys(mockClassification.probabilities).forEach((key) => {
      mockClassification.probabilities[key as keyof typeof mockClassification.probabilities] /= total;
    });

    return NextResponse.json(mockClassification, { status: 200 });
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during classification' },
      { status: 500 }
    );
  }
}
