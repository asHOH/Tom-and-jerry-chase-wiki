import { useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useRTEConfiguration } from './useRTEConfiguration';

jest.mock('@/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_RTE_IMAGE_BUCKET: 'article-media',
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  },
}));

const content =
  '<p style="text-align:center;color:red" class="lead">Body</p>' +
  '<table><tr><td><p>Cell</p></td></tr></table>' +
  '<img src="/images/local.png">' +
  '<img src="https://project.supabase.co/storage/v1/object/public/article-media/hosted.png">' +
  '<img src="https://example.com/blocked.png">';

describe('useRTEConfiguration', () => {
  it('preserves the cursor while typing around a notice link and receiving controlled updates', async () => {
    const initialHtml = '<p>Hello <a href="https://example.com">link</a> world</p>';
    const onChange = jest.fn();
    const { result } = renderHook(() => {
      const [html, setHtml] = useState(initialHtml);
      return useRTEConfiguration({
        initialHtml,
        content: html,
        preset: 'notice',
        onChange: (updatedHtml) => {
          onChange(updatedHtml);
          setHtml(updatedHtml);
        },
      });
    });
    await waitFor(() => expect(result.current).not.toBeNull());

    act(() => {
      result.current!.commands.setTextSelection(3);
      result.current!.commands.insertContent('X');
    });

    expect(result.current!.state.selection.from).toBe(4);

    act(() => {
      result.current!.commands.insertContent('Y');
    });

    expect(result.current!.state.selection.from).toBe(5);
    expect(result.current!.getText()).toBe('HeXYllo link world');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(
      '<p>HeXYllo <a href="https://example.com">link</a> world</p>'
    );
  });

  it('normalizes real editor transactions before emitting one full-preset update', async () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useRTEConfiguration({ initialHtml: '<p>Start</p>', content: '<p>Start</p>', onChange })
    );
    await waitFor(() => expect(result.current).not.toBeNull());

    act(() => {
      result.current!.commands.setContent(content, { emitUpdate: true });
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const output = onChange.mock.calls[0]![0] as string;
    expect(output).toContain('<p class="rte-text-center">Body</p>');
    expect(output).toContain('<table');
    expect(output).toContain('/images/local.png');
    expect(output).toContain('article-media/hosted.png');
    expect(output).not.toMatch(/style=|lead|blocked/);
    expect(result.current!.getHTML()).toContain('<table');
    expect(result.current!.getHTML()).toContain('/images/local.png');
    expect(result.current!.getHTML()).not.toContain('blocked.png');
  });

  it('removes forbidden nodes on preset changes and uses the latest preset for later transactions', async () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ preset }: { preset: 'full' | 'notice' }) =>
        useRTEConfiguration({ initialHtml: content, content, onChange, preset }),
      { initialProps: { preset: 'full' } }
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current!.getHTML()).toContain('<table');
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(1);
    onChange.mockClear();

    onChange.mockImplementation((html: string) => {
      expect(html).not.toMatch(/<table|<img/);
      expect(result.current!.getHTML()).not.toMatch(/<table|<img/);
    });
    rerender({ preset: 'notice' });

    expect(result.current!.getHTML()).toBe('<p class="rte-text-center">Body</p><p>Cell</p>');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(
      '<p class="rte-text-center">Body</p><p>Cell</p>',
      'sync'
    );

    act(() => {
      result.current!.commands.setContent(content.replace('Body', 'Updated'), {
        emitUpdate: true,
      });
    });

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.stringContaining('<p class="rte-text-center">Updated</p><p>Cell</p>')
    );
  });

  it('normalizes initial notice content and emits the editor form of external replacements once', async () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ html }) =>
        useRTEConfiguration({ initialHtml: html, content: html, onChange, preset: 'notice' }),
      { initialProps: { html: content } }
    );
    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current!.getHTML()).toBe('<p class="rte-text-center">Body</p><p>Cell</p>');
    expect(onChange).not.toHaveBeenCalled();

    rerender({ html: '<div>External</div><img src="/images/local.png">' });

    expect(result.current!.getHTML()).toBe('<p>External</p>');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('<p>External</p>', 'sync');
  });
});
