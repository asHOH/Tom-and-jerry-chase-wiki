'use client';

import StyledMDX from '@/components/ui/StyledMDX';

import MDXContent from '../articles/Edit.mdx';

export default function EditPage() {
  return (
    <StyledMDX className='article-content'>
      <MDXContent />
    </StyledMDX>
  );
}
