import { Component, createRef } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';

export default class HCaptchaComponent extends Component<{
  onVerify: (token: string) => void;
}> {
  private hcaptchaRef = createRef<HCaptcha>();

  handleVerify = (token: string) => {
    this.props.onVerify(token);
  };

  // executeCaptcha = () => {
  //   if (this.hcaptchaRef.current) {
  //     this.hcaptchaRef.current.execute({ async: true }).then(({ response }) => {
  //       this.props.onVerify(response);
  //     });
  //   }
  // };

  render() {
    return (
      <HCaptcha
        ref={this.hcaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY!}
        onVerify={this.handleVerify}
        // onLoad={this.executeCaptcha}
        size='compact'
      />
    );
  }
}
