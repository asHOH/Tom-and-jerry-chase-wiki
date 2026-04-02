'use client';

import StyledMDX from '@/components/ui/StyledMDX';

import CharacterMDX from '../articles/Character.mdx';
import DamageMDX from '../articles/Damage.mdx';
import ExpMDX from '../articles/Exp.mdx';
import HpMDX from '../articles/Hp.mdx';
import ItemMDX from '../articles/Item.mdx';
import MoveMDX from '../articles/Move.mdx';
import ObjectMDX from '../articles/Object.mdx';
import PrepareMDX from '../articles/Prepare.mdx';

export function Object() {
  return (
    <StyledMDX className='article-content'>
      <ObjectMDX />
    </StyledMDX>
  );
}
export function Move() {
  return (
    <StyledMDX className='article-content'>
      <MoveMDX />
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
export function Damage() {
  return (
    <StyledMDX className='article-content'>
      <DamageMDX />
    </StyledMDX>
  );
}
export function Character() {
  return (
    <StyledMDX className='article-content'>
      <CharacterMDX />
    </StyledMDX>
  );
}
export function Item() {
  return (
    <StyledMDX className='article-content'>
      <ItemMDX />
    </StyledMDX>
  );
}
export function Prepare() {
  return (
    <StyledMDX className='article-content'>
      <PrepareMDX />
    </StyledMDX>
  );
}
