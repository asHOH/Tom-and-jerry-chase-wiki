'use client';

import { useSnapshot } from 'valtio';

import { getFixtureSourceColors, getFixtureTypeColors } from '@/lib/design';
import { getSingleItemPrototype, getSingleItemVariant } from '@/lib/singleItemTools';
import { useLocalFixture } from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { Fixture } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import CharacterLikeAttributesSection from '@/features/shared/detail-view/CharacterLikeAttributesSection';
import PhysicalAttributesSection from '@/features/shared/detail-view/PhysicalAttributesSection';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { fixturesEdit } from '@/data';

export default function FixtureAttributesCard({ fixture }: { fixture: Fixture }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const { fixtureName } = useLocalFixture();
  const ed = editable('fixtures');

  const fixturesSnapshot = useSnapshot(fixturesEdit);
  if (!fixture) return null;

  const rawFixture = fixturesEdit[fixtureName];
  const effectiveFixture = (
    isEditMode ? (fixturesSnapshot[fixtureName] ?? fixture) : fixture
  ) as Fixture;

  /* 计算variant相关内容 */
  const prototype = getSingleItemPrototype({ name: fixture.name, type: 'fixture' });
  const variant = getSingleItemVariant({ name: fixture.name, type: 'fixture' });
  /* -------- */

  function putTypeTagOn(currentFixture: Fixture) {
    if (typeof currentFixture.type === 'string') {
      return (
        <Tag
          size='sm'
          margin='compact'
          colorStyles={getFixtureTypeColors(currentFixture.type, isDarkMode)}
        >
          {currentFixture.type}
        </Tag>
      );
    } else {
      return currentFixture.type.map((type) => {
        return (
          <Tag
            size='sm'
            margin='compact'
            colorStyles={getFixtureTypeColors(type, isDarkMode)}
            key={type}
          >
            {type}
          </Tag>
        );
      });
    }
  }

  return (
    <AttributesCardLayout
      imageUrl={fixture.imageUrl}
      alt={fixture.name}
      title={fixture.name}
      subtitle='(地图组件)'
      aliases={isEditMode ? undefined : fixture.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(effectiveFixture.aliases ?? fixture.aliases ?? []).length > 0 ? (
              (effectiveFixture.aliases ?? fixture.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawFixture) return;
                      if (!rawFixture.aliases) rawFixture.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawFixture.aliases = rawFixture.aliases.filter((_, i) => i !== index);
                      } else {
                        rawFixture.aliases[index] = trimmed;
                      }
                    }}
                  />
                  {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
                </span>
              ))
            ) : (
              <span>{'<无内容>'}</span>
            )}
            <AddAliasButton
              onAdd={() => {
                if (!rawFixture) return;
                if (!rawFixture.aliases) rawFixture.aliases = [];
                if (!rawFixture.aliases.includes('新别名')) {
                  rawFixture.aliases.push('新别名');
                }
              }}
            />
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            {putTypeTagOn(effectiveFixture)}
            {effectiveFixture.source && (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getFixtureSourceColors(effectiveFixture.source, isDarkMode)}
              >
                <ed.span
                  path='source'
                  initialValue={effectiveFixture.source ?? '<无内容>'}
                  isSingleLine
                />
              </Tag>
            )}
          </div>
          {isEditMode && !effectiveFixture.source && (
            <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>来源: </span>
              <span className='text-indigo-700 dark:text-indigo-400'>
                <ed.span path='source' initialValue={'<无内容>'} isSingleLine />
              </span>
            </div>
          )}
          <CharacterLikeAttributesSection
            attributes={effectiveFixture.fixtureAttributesAsCharacter}
            intro='该物件特性与'
            isDetailed={isDetailed}
          />
          <PhysicalAttributesSection
            attributes={effectiveFixture}
            draftAttributes={rawFixture}
            isEditMode={isEditMode}
          />
          {(prototype.length > 0 || variant.length > 0) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              {prototype.length > 0 && (
                <div>
                  <span className='text-lg font-bold whitespace-pre'>本内容为以下内容的变种：</span>
                  <div className='mt-1'>
                    <SingleItemAccordionCard items={prototype} />
                  </div>
                </div>
              )}
              {variant.length > 0 && (
                <div className={prototype.length > 0 ? 'mt-2' : ''}>
                  <span className='text-lg font-bold whitespace-pre'>本内容有以下变种：</span>
                  <div className='mt-1'>
                    <SingleItemAccordionCard items={variant} />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={fixture.name} specifyType='fixture' />
        </NavigationButtonsRow>
      }
      wikiHistory={
        <SingleItemWikiHistoryDisplay singleItem={{ name: fixture.name, type: 'fixture' }} />
      }
    />
  );
}
