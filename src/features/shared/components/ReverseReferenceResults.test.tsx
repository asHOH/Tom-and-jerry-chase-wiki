import { renderToStaticMarkup } from 'react-dom/server';

import { createReferenceHighlighter } from './ReverseReferenceResults';

it('highlights literal punctuation and gives an original name precedence over an alias', () => {
  const highlight = createReferenceHighlighter({
    originalKeywords: ['{加速(猫特技)}'],
    aliasKeywords: ['{加速(猫特技)}', '{提速}'],
    groupKeywords: [],
  });
  const html = renderToStaticMarkup(<p>{highlight('{加速(猫特技)}与{提速}')}</p>);
  expect(html).toContain('text-blue-600 dark:text-blue-400">{加速(猫特技)}</span>');
  expect(html).toContain('text-violet-600 dark:text-violet-400">{提速}</span>');
});
