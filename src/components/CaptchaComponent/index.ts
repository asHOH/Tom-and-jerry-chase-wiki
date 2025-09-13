import type { ComponentType } from 'react';
import HCaptchaComponent from './HCaptchaComponent';
import NoOpComponent from './NoOpComponent';
import TurnstileComponent from './TurnstileComponent';

const captchaProvider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER;

type CaptchaProps = { onVerify: (token: string) => void };

let CaptchaComponent: ComponentType<CaptchaProps>;

if (captchaProvider === 'hcaptcha') {
  CaptchaComponent = HCaptchaComponent;
} else if (captchaProvider === 'turnstile') {
  CaptchaComponent = TurnstileComponent;
} else {
  CaptchaComponent = NoOpComponent;
}

export default CaptchaComponent;
