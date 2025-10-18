import React from 'react';
import Image from '@/components/Image';
import GotoLink from '@/components/GotoLink';
import Tag from '@/components/ui/Tag';
import { getCardRankColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';
import type { TreeNode } from '@/lib/knowledgeCardSectionUtils';

interface TreeCardDisplayProps {
  tree: TreeNode[];
  isEditMode: boolean;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  characterId: string;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  isOptionalCard: (cardId: string) => boolean;
}

interface CardDisplayProps {
  cardId: string;
  isEditMode: boolean;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  characterId: string;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  isOptional: boolean;
  isDarkMode: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({
  cardId,
  isEditMode,
  isSqueezedView,
  handleSelectCard,
  characterId,
  getCardRank,
  imageBasePath,
  isOptional,
  isDarkMode,
}) => {
  const cardName = cardId.split('-')[1]!;
  const cardRank = getCardRank(cardId);
  const rankColors = getCardRankColors(cardRank, false, isDarkMode);

  if (isSqueezedView) {
    return (
      <GotoLink key={cardId} name={cardName} className='no-underline' asPreviewOnly>
        <span
          onClick={() => {
            if (isEditMode) return;
            handleSelectCard(cardName, characterId);
          }}
          className='cursor-pointer'
        >
          <Tag
            colorStyles={rankColors}
            size='sm'
            margin='compact'
            className={clsx(
              'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
              isOptional && 'opacity-50'
            )}
          >
            {cardName}
          </Tag>
        </span>
      </GotoLink>
    );
  }

  return (
    <GotoLink key={cardId} name={cardName} className='no-underline' asPreviewOnly hideImagePreview>
      <div
        className={clsx(
          'relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer transition-transform duration-200 hover:scale-105',
          isOptional && 'opacity-50'
        )}
        onClick={() => {
          if (isEditMode) return;
          handleSelectCard(cardName, characterId);
        }}
      >
        <Image src={`${imageBasePath}${cardId}.png`} alt={cardId} fill className='object-contain' />
      </div>
    </GotoLink>
  );
};

const TreeNodeDisplay: React.FC<
  TreeCardDisplayProps & {
    node: TreeNode;
    depth: number;
  }
> = ({ node, depth, ...props }) => {
  const [isDarkMode] = useDarkMode();

  if (node.type === 'card' && node.cardId) {
    const isOptional = props.isOptionalCard(node.cardId);
    return (
      <CardDisplay
        cardId={node.cardId}
        isEditMode={props.isEditMode}
        isSqueezedView={props.isSqueezedView}
        handleSelectCard={props.handleSelectCard}
        characterId={props.characterId}
        getCardRank={props.getCardRank}
        imageBasePath={props.imageBasePath}
        isOptional={isOptional}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (node.type === 'and-group' && node.children) {
    return (
      <div
        className={clsx('flex flex-wrap items-center', props.isSqueezedView ? 'gap-1' : 'gap-2')}
      >
        {node.children.map((child, index) => (
          <TreeNodeDisplay key={index} node={child} depth={depth + 1} {...props} />
        ))}
      </div>
    );
  }

  if (node.type === 'or-group' && node.children) {
    // Render children in a vertical column
    return (
      <div className='flex flex-col gap-1 items-center'>
        {node.children.map((child, index) => (
          <TreeNodeDisplay key={index} node={child} depth={depth + 1} {...props} />
        ))}
      </div>
    );
  }

  return null;
};

const TreeCardDisplay: React.FC<TreeCardDisplayProps> = (props) => {
  return (
    <div className={clsx('flex flex-wrap items-center', props.isSqueezedView ? 'gap-1' : 'gap-2')}>
      {props.tree.map((node, index) => (
        <TreeNodeDisplay key={index} node={node} depth={0} {...props} />
      ))}
    </div>
  );
};

export default TreeCardDisplay;
