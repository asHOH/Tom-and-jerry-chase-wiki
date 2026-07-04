'use client';

import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';

import { env } from '@/env';

import NoOpComponent from './NoOpComponent';

const captchaProvider = env.NEXT_PUBLIC_CAPTCHA_PROVIDER;

type CaptchaProps = { onVerify: (token: string) => void };

let CaptchaComponent: ComponentType<CaptchaProps>;

if (captchaProvider === 'hcaptcha') {
  CaptchaComponent = dynamic(() => import('./HCaptchaComponent'), { ssr: false });
} else if (captchaProvider === 'turnstile') {
  CaptchaComponent = dynamic(() => import('./TurnstileComponent'), { ssr: false });
} else {
  CaptchaComponent = NoOpComponent;
}

export default CaptchaComponent;
