import React from 'react';
import Tag from '../../../ui/Tag';
import { getPositioningTagColors, getPositioningTagContainerColor } from '@/lib/design-tokens';
import EditableField from '@/components/ui/EditableField';
import Tooltip from '@/components/ui/Tooltip';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useEditMode } from '@/context/EditModeContext';

interface PositioningTagsSectionProps {
  tags: Array<{
    tagName: string;
    isMinor: boolean;
    description: string;
    additionalDescription?: string;
  }>;
  factionId: 'cat' | 'mouse';
  isDetailed: boolean;
  characterId: string;
}

export default function PositioningTagsSection({
  tags,
  factionId,
  isDetailed,
  characterId,
}: PositioningTagsSectionProps) {
  const { isEditMode } = useEditMode();
  if (!tags || tags.length === 0) return null;

  const borderColor = factionId === 'cat' ? 'border-orange-200' : 'border-blue-200';
  const tagsKey = factionId === 'cat' ? 'catPositioningTags' : 'mousePositioningTags';

  return (
    <div className='mt-6 pt-4 border-t border-gray-200'>
      <h3 className='text-lg font-semibold text-gray-800 mb-3'>定位</h3>
      <div className='space-y-3'>
        {tags.map((tag, index) => (
          <div
            key={index}
            className={`rounded-lg p-3 ${getPositioningTagContainerColor(
              tag.tagName,
              tag.isMinor,
              factionId
            )}`}
          >
            <div className='flex items-center gap-2 mb-2'>
              <Tag
                colorStyles={getPositioningTagColors(tag.tagName, tag.isMinor, true, factionId)}
                size='sm'
              >
                {isEditMode ? (
                  <EditableField
                    tag='span'
                    path={`${characterId}.${tagsKey}.${index}.tagName`}
                    initialValue={tag.tagName}
                  />
                ) : (
                  <Tooltip
                    content={getPositioningTagTooltipContent(tag.tagName, factionId, isDetailed)}
                  >
                    {tag.tagName}
                  </Tooltip>
                )}
              </Tag>
              {tag.isMinor && <span className='text-xs text-gray-500'>(次要)</span>}
            </div>
            <EditableField
              tag='p'
              path={`${characterId}.${tagsKey}.${index}.description`}
              initialValue={tag.description}
              className='text-sm text-gray-700 mb-1'
            />
            {isDetailed && tag.additionalDescription && (
              <EditableField
                tag='p'
                path={`${characterId}.${tagsKey}.${index}.additionalDescription`}
                initialValue={tag.additionalDescription}
                className={`text-sm text-gray-600 mt-2 pl-3 border-l-2 ${borderColor}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
