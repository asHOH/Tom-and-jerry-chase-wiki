'use client';

import StyledMDX from '@/components/ui/StyledMDX';

import MDXContent from '../articles/Use.mdx';

export default function UsePage() {
  return (
    <StyledMDX className='article-content'>
      <MDXContent />
    </StyledMDX>
  );
}
