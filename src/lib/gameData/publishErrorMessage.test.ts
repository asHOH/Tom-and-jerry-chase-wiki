import { getPublishErrorMessage } from './publishErrorMessage';

describe('getPublishErrorMessage', () => {
  it('shows the safe server explanation with its request ID', () => {
    expect(
      getPublishErrorMessage(
        {
          error: 'dependent_rows',
          message: '草稿已保留',
          requestId: 'request-123',
        },
        '发布失败'
      )
    ).toBe('草稿已保留（请求编号：request-123）');
  });

  it('falls back to the stable error code and then the local fallback', () => {
    expect(getPublishErrorMessage({ error: 'invalid_shape' }, '发布失败')).toBe('invalid_shape');
    expect(getPublishErrorMessage(null, '发布失败')).toBe('发布失败');
  });
});
