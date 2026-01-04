declare module '*.mdx' {
  import type { MDXProps } from 'mdx/types';
  import type { ReactNode } from 'react';

  export default function MDXContent(props: MDXProps): ReactNode;
}
