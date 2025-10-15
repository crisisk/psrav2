import { NextResponse, NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET || !process.env.MICROSOFT_REDIRECT_URI) {
      throw new Error('Microsoft authentication configuration is incomplete');
    }

    // Generate security parameters
    const state = randomBytes(16).toString('hex');
    const nonce = randomBytes(16).toString('hex');

    // Construct authorization URL
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      scope: 'openid profile email',
      state,
      nonce,
      response_mode: 'query'
    });

    const authorizationUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    // Create response and set security cookies
    const response = NextResponse.json({ url: authorizationUrl });

    response.cookies.set({
      name: 'microsoft_state',
      value: state,
      maxAge: 600,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    response.cookies.set({
      name: 'microsoft_nonce',
      value: nonce,
      maxAge: 600,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Microsoft auth initiation error:', error);
    return NextResponse.json(
      { error: 'Authentication initialization failed' },
      { status: 500 }
    );
  }
}
