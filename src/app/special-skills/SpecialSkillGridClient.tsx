'use client';
import dynamic from 'next/dynamic';

const SpecialSkillClient = dynamic(
  () => import('@/components/displays/special-skills/special-skill-grid/SpecialSkillGrid')
);

export default SpecialSkillClient;
