import { createHmac } from 'crypto';

export async function verifyCaptchaToken(token: string | null | undefined): Promise<boolean> {
  const provider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
  const secretKey = process.env.CAPTCHA_SECRET_KEY;

  // If captcha is disabled or not configured, do nothing.
  if (!provider || !secretKey) {
    return true;
  }

  // If no token is provided when captcha is enabled, throw forbidden.
  if (!token) {
    return false;
  }

  if (provider === 'hcaptcha') {
    const params = new URLSearchParams();
    params.append('response', token);
    params.append('secret', secretKey);

    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      body: params,
    });

    return (await response.json()).success;
  }

  if (provider === 'turnstile') {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success;
  }

  return true;
}

export function generateCaptchaProof(username: string): string {
  const secret = process.env.CAPTCHA_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

export function verifyCaptchaProof(token: string, username: string): boolean {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;

  const [tokenUsername, timestampStr, signature] = parts;
  if (tokenUsername !== username) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Token expires in 10 minutes
  if (Date.now() - timestamp > 10 * 60 * 1000) return false;

  const secret = process.env.CAPTCHA_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const payload = `${username}:${timestamp}`;
  const expectedSignature = createHmac('sha256', secret).update(payload).digest('hex');

  return signature === expectedSignature;
}

import { createHmac } from 'crypto';
