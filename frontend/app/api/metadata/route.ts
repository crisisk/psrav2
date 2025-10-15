import { NextResponse } from 'next/server';
import os from 'os';

type SystemMetadata = {
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
  };
  version: string;
  serverDate: string;
};

export async function GET() {
  try {
    const metadata: SystemMetadata = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.versions.node,
      },
      version: process.env.APP_VERSION || 'unknown',
      serverDate: new Date().toISOString(),
    };

    if (!metadata.version || metadata.version === 'unknown') {
      throw new Error('Application version not configured');
    }

    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve system metadata' },
      { status: 500 }
    );
  }
}
