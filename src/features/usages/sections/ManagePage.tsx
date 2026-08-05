'use client';

import StyledMDX from '@/components/ui/StyledMDX';

import MDXContent from '../articles/Manage.mdx';

export default function ManagePage() {
  return (
    <StyledMDX className='article-content'>
      <MDXContent />
    </StyledMDX>
  );
}
