'use client';

import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { SpecialSkill } from '@/data/types';

import Tag from '@/components/ui/Tag';
import { designTokens } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillDetailClient({ skill }: SpecialSkillDetailClientProps) {
  const { isDetailedView } = useAppContext();
  const [isDarkMode] = useDarkMode();

  if (!skill) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.xl }}>
      <div className='flex flex-col md:flex-row' style={{ gap: designTokens.spacing.xl }}>
        <div className='md:w-1/3'>
          <div className='card h-full dark:bg-slate-800 dark:border-slate-700'>
            <div className='w-full h-64 bg-gray-200 dark:bg-slate-700 rounded-lg relative overflow-hidden mb-4 image-container'>
              <div className='flex items-center justify-center h-full p-3'>
                <Image
                  src={skill.imageUrl}
                  alt={skill.name}
                  width={200}
                  height={200}
                  style={{
                    objectFit: 'contain',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                />
              </div>
            </div>
            <div style={{ padding: designTokens.spacing.md }}>
              <h1
                className='text-3xl font-bold dark:text-white'
                style={{ paddingBottom: designTokens.spacing.sm }}
              >
                {skill.name}
              </h1>
              <div
                className='flex items-center flex-wrap'
                style={{
                  marginTop: designTokens.spacing.lg,
                  gap: designTokens.spacing.sm,
                }}
              >
                <Tag
                  colorStyles={
                    isDarkMode
                      ? { background: '#334155', color: '#e0e7ef' }
                      : { background: '#e0e7ef', color: '#1e293b' }
                  }
                  size='md'
                >
                  冷却时间: {skill.cooldown}s
                </Tag>
                <Tag
                  colorStyles={
                    isDarkMode
                      ? { background: '#334155', color: '#e0e7ef' }
                      : { background: '#e0e7ef', color: '#1e293b' }
                  }
                  size='md'
                >
                  阵营: {skill.factionId === 'cat' ? '猫' : '鼠'}
                </Tag>
              </div>
            </div>
          </div>
        </div>
        <div className='md:w-2/3'>
          <div
            className='flex items-center'
            style={{
              marginBottom: designTokens.spacing.lg,
              paddingLeft: designTokens.spacing.sm,
              paddingRight: designTokens.spacing.sm,
            }}
          >
            <h2
              className='text-2xl font-bold dark:text-white'
              style={{
                paddingTop: designTokens.spacing.sm,
                paddingBottom: designTokens.spacing.sm,
              }}
            >
              技能描述
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.lg }}>
            <div
              className='card dark:bg-slate-800 dark:border-slate-700'
              style={{ padding: designTokens.spacing.lg }}
            >
              <div>
                <p
                  className='text-black dark:text-gray-200 text-lg'
                  style={{
                    paddingTop: designTokens.spacing.sm,
                    paddingBottom: designTokens.spacing.sm,
                  }}
                >
                  {isDetailedView && skill.detailedDescription
                    ? skill.detailedDescription
                    : skill.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
