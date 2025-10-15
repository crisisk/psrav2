import { NextResponse, type NextRequest } from 'next/server';
import { encode } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const cookieState = request.cookies.get('oauth_state')?.value;

    if (!code || !state || !cookieState) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    if (state !== cookieState) {
      return new NextResponse('Invalid state parameter', { status: 401 });
    }

    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return new NextResponse('Authentication failed', { status: 400 });
    }

    const tokens = await tokenResponse.json();
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return new NextResponse('Failed to fetch user profile', { status: 400 });
    }

    const userInfo = await userInfoResponse.json();
    const sessionPayload = {
      user: {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
      },
      expires: Date.now() + (tokens.expires_in * 1000),
    };

    const encryptedSession = await encode({
      token: sessionPayload,
      secret: process.env.NEXTAUTH_SECRET!,
      salt: 'authjs.session-token',
    });

    const response = NextResponse.redirect(process.env.NEXTAUTH_URL!);
    response.cookies.set('session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expires_in,
      path: '/',
    });

    response.cookies.delete('oauth_state');
    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
