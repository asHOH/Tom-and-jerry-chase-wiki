import { Component } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

export default class TurnstileComponent extends Component<{
  onVerify: (token: string) => void;
}> {
  handleVerify = (token: string) => {
    this.props.onVerify(token);
  };

  render() {
    return (
      <Turnstile
        siteKey={process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY!}
        onSuccess={this.handleVerify}
        // options={{
        //   size: 'invisible',
        // }}
      />
    );
  }
}
