import { useCallback, useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import RichTextEditor from './RichTextEditor';

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ error: jest.fn() }),
}));
jest.mock('@/env', () => ({ env: { NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR: '0' } }));
jest.mock('./RichTextEditor/ImagePickerModal', () => () => null);
jest.mock('./RichTextEditor/LinkDialog', () => () => null);

const articleHtml =
  '<h2 class="rte-text-center">Title</h2>' +
  '<table><tr><th>Character</th><td>Jerry</td></tr></table>' +
  '<img src="/images/jerry.png" alt="Jerry">';
const replacementHtml = '<h2>Replacement</h2><p>New body</p>';

type ControlledEditorProps = {
  initialContent: string;
  onChange: (content: string) => void;
  preset?: 'full' | 'notice';
};

function ControlledEditor({ initialContent, onChange, preset = 'full' }: ControlledEditorProps) {
  const [content, setContent] = useState(initialContent);
  const handleChange = useCallback(
    (nextContent: string) => {
      onChange(nextContent);
      setContent(nextContent);
    },
    [onChange]
  );

  return (
    <>
      <button onClick={() => setContent(replacementHtml)}>Replace content</button>
      <RichTextEditor content={content} onChange={handleChange} preset={preset} />
    </>
  );
}

function changeMode(name: 'Rich' | 'HTML' | 'WikiText (实验)') {
  fireEvent.click(
    within(screen.getByRole('group', { name: '编辑模式' })).getByRole('button', { name })
  );
}

describe('RichTextEditor', () => {
  it('preserves tables, allowed images, and alignment across controlled HTML and Rich edits', async () => {
    const onChange = jest.fn();
    render(<ControlledEditor initialContent={articleHtml} onChange={onChange} />);
    await screen.findByRole('group', { name: '编辑模式' });

    expect(screen.getByRole('heading', { name: 'Title' })).toHaveClass('rte-text-center');
    expect(screen.getByRole('cell', { name: 'Jerry' })).toBeInTheDocument();
    expect(screen.getByAltText('Jerry')).toHaveAttribute('src', '/images/jerry.png');
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(1);
    onChange.mockClear();

    changeMode('HTML');
    const source = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'HTML editor' });
    expect(source.value).toContain('rte-text-center');
    expect(source.value).toContain('<table');
    expect(source.value).toContain('/images/jerry.png');

    fireEvent.change(source, {
      target: {
        value: articleHtml.replace(
          '<h2 class="rte-text-center">Title</h2>',
          '<h2 style="text-align: right; color: red" class="untrusted">Edited title</h2>'
        ),
      },
    });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
    expect(onChange).toHaveBeenLastCalledWith(expect.stringContaining('rte-text-right'));
    expect(onChange.mock.calls[0]?.[0]).not.toMatch(/style=|untrusted/);

    changeMode('Rich');
    expect(screen.getByRole('heading', { name: 'Edited title' })).toHaveClass('rte-text-right');
    expect(screen.getByRole('cell', { name: 'Jerry' })).toBeInTheDocument();
    expect(screen.getByAltText('Jerry')).toHaveAttribute('src', '/images/jerry.png');

    changeMode('HTML');
    expect(
      screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'HTML editor' }).value
    ).toContain('rte-text-right');
    changeMode('Rich');
    expect(screen.getByRole('heading', { name: 'Edited title' })).toHaveClass('rte-text-right');
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(4);
  });

  it('filters notice HTML before publishing changes and hides WikiText mode', async () => {
    const onChange = jest.fn();
    render(<ControlledEditor initialContent='<p>Start</p>' onChange={onChange} preset='notice' />);
    const modes = within(await screen.findByRole('group', { name: '编辑模式' }));
    expect(modes.queryByRole('button', { name: /WikiText/ })).not.toBeInTheDocument();

    changeMode('HTML');
    fireEvent.change(screen.getByRole('textbox', { name: 'HTML editor' }), {
      target: {
        value:
          '<p style="text-align: right; color: red" class="untrusted">Notice</p>' +
          '<table><tr><td>Cell text</td></tr></table><img src="/images/jerry.png">',
      },
    });

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
    for (const [emittedHtml] of onChange.mock.calls) {
      expect(emittedHtml).toContain('<p class="rte-text-right">Notice</p>');
      expect(emittedHtml).toContain('Cell text');
      expect(emittedHtml).not.toMatch(/<(?:table|tr|td|img)\b|style=|untrusted/);
    }

    changeMode('Rich');
    expect(screen.getByText('Notice')).toHaveClass('rte-text-right');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByAltText('')).not.toBeInTheDocument();
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('removes existing table and image nodes when the preset changes to notice', async () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <ControlledEditor initialContent={articleHtml} onChange={onChange} />
    );
    await screen.findByRole('table');
    onChange.mockClear();

    rerender(<ControlledEditor initialContent={articleHtml} onChange={onChange} preset='notice' />);

    await waitFor(() => expect(screen.queryByRole('table')).not.toBeInTheDocument());
    expect(screen.queryByAltText('Jerry')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Title' })).toHaveClass('rte-text-center');
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
    for (const [emittedHtml] of onChange.mock.calls) {
      expect(emittedHtml).not.toMatch(/<(?:table|tr|th|td|img)\b/);
    }
  });

  it.each([
    ['HTML', 'HTML editor'],
    ['WikiText (实验)', 'WikiText editor'],
  ] as const)('uses external content replacements while in %s mode', async (mode, label) => {
    const onChange = jest.fn();
    render(<ControlledEditor initialContent='<p>Original</p>' onChange={onChange} />);
    await screen.findByRole('group', { name: '编辑模式' });
    changeMode(mode);
    fireEvent.change(screen.getByRole('textbox', { name: label }), {
      target: { value: mode === 'HTML' ? '<p>Stale edit</p>' : 'Stale edit' },
    });
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
    onChange.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Replace content' }));
    await waitFor(() =>
      expect(screen.getByRole<HTMLTextAreaElement>('textbox', { name: label }).value).toContain(
        'Replacement'
      )
    );
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(1);

    changeMode('Rich');
    expect(screen.getByRole('heading', { name: 'Replacement' })).toBeInTheDocument();
    expect(screen.getByText('New body')).toBeInTheDocument();
    expect(screen.queryByText('Stale edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Original')).not.toBeInTheDocument();
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(2);
  });
});
