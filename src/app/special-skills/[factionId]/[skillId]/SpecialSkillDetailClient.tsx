'use client';
import dynamic from 'next/dynamic';

const SpecialSkillDetailClient = dynamic(
  () => import('@/components/displays/special-skills/special-skill-detail/SpecialSkillDetail')
);
export default SpecialSkillDetailClient;
