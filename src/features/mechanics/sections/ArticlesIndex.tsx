'use client';

import StyledMDX from '@/components/ui/StyledMDX';

import ExpMDX from '../articles/Exp.mdx';
import HpMDX from '../articles/Hp.mdx';
import ObjectMDX from '../articles/Object.mdx';

export function Object() {
  return (
    <StyledMDX className='article-content'>
      <ObjectMDX />
    </StyledMDX>
  );
}

export function Exp() {
  return (
    <StyledMDX className='article-content'>
      <ExpMDX />
    </StyledMDX>
  );
}
export function Hp() {
  return (
    <StyledMDX className='article-content'>
      <HpMDX />
    </StyledMDX>
  );
}
