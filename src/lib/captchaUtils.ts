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
