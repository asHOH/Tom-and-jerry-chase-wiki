import { env } from '@/env';

export async function verifyCaptchaToken(token: string | null | undefined): Promise<boolean> {
  const provider = env.NEXT_PUBLIC_CAPTCHA_PROVIDER;
  const secretKey = env.CAPTCHA_SECRET_KEY;

  // Fail closed when captcha is expected but misconfigured.
  if (!provider || !secretKey) {
    console.error('Captcha verification failed: provider or secret key is missing.');
    return false;
  }

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

    if (!response.ok) return false;
    return Boolean((await response.json()).success);
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

    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.success);
  }

  return false;
}
