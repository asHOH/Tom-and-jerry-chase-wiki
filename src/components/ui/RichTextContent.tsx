import type { ReactNode } from 'react';
import parse, { domToReact, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';

import { getInternalLinkHref } from '@/lib/internalLinkUtils';
import Link from '@/components/Link';

const linkParserOptions: HTMLReactParserOptions = {
  replace: (node, index) => {
    if (node.type !== 'tag' || node.name !== 'a') {
      return undefined;
    }

    const href = node.attribs.href;
    const internalHref = href ? getInternalLinkHref(href) : null;
    if (!internalHref) {
      return undefined;
    }

    const className = node.attribs.class;
    const title = node.attribs.title;

    return (
      <Link
        key={`rich-text-link-${index}`}
        href={internalHref}
        {...(className ? { className } : {})}
        {...(title ? { title } : {})}
      >
        {domToReact(node.children as DOMNode[], linkParserOptions)}
      </Link>
    );
  },
};

const parserOptions: HTMLReactParserOptions = {
  replace: (node, index) => {
    if (node.type === 'tag' && node.name === 'table') {
      return (
        <div className='tableWrapper' role='region' aria-label='表格' tabIndex={0}>
          {domToReact([node], linkParserOptions)}
        </div>
      );
    }
    return linkParserOptions.replace?.(node, index);
  },
};

export function renderRichTextContent(html: string): ReactNode {
  return parse(html, parserOptions);
}
