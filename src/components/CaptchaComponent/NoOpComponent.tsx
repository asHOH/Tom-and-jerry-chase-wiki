import { Component } from 'react';

export default class NoOpComponent extends Component<{
  onVerify: (token: string) => void;
}> {
  componentDidMount() {
    this.props.onVerify('');
  }

  render() {
    return null;
  }
}
