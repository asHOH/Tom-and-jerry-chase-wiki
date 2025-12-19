import { render, screen } from '@testing-library/react';

import {
  extractItemKeyActions,
  formatTextWithEnhancedMarkdown,
  hasTextPattern,
  normalizeText,
  renderTextWithHighlights,
} from './textUtils';

describe('textUtils', () => {
  describe('renderTextWithHighlights', () => {
    it('should render plain text without highlights', () => {
      const { container } = render(<>{renderTextWithHighlights('Hello world')}</>);
      expect(container).toHaveTextContent('Hello world');
    });

    it('should render text with bold markdown highlights', () => {
      render(<>{renderTextWithHighlights('Hello **world** test')}</>);
      expect(screen.getByText('world')).toBeInTheDocument();
      expect(screen.getByText('world')).toHaveClass('underline decoration-2 underline-offset-2');
    });

    it('should handle multiple highlights', () => {
      render(<>{renderTextWithHighlights('**First** and **Second** highlights')}</>);
      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  describe('formatTextWithEnhancedMarkdown', () => {
    it('should format text with bold markdown', () => {
      render(formatTextWithEnhancedMarkdown('Hello **world**'));

      expect(screen.getByText('world')).toBeInTheDocument();
      expect(screen.getByText('world')).toHaveClass('underline');
    });

    it('should format text with numerical patterns', () => {
      render(formatTextWithEnhancedMarkdown('Damage: 50点 for 3秒'));

      expect(screen.getByText('50点')).toBeInTheDocument();
      expect(screen.getByText('3秒')).toBeInTheDocument();
      expect(screen.getByText('50点')).toHaveClass('underline');
      expect(screen.getByText('3秒')).toHaveClass('underline');
    });

    it('should format percentage values', () => {
      render(formatTextWithEnhancedMarkdown('Increase by 25%'));

      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toHaveClass('underline');
    });

    it('should handle mixed formatting', () => {
      render(formatTextWithEnhancedMarkdown('**Skill** deals 100点 damage'));

      expect(screen.getByText('Skill')).toBeInTheDocument();
      expect(screen.getByText('100点')).toBeInTheDocument();
      expect(screen.getByText('Skill')).toHaveClass('underline');
      expect(screen.getByText('100点')).toHaveClass('underline');
    });
  });

  describe('hasTextPattern', () => {
    it('should detect markdown patterns', () => {
      expect(hasTextPattern('Hello **world**', 'markdown')).toBe(true);
      expect(hasTextPattern('Hello world', 'markdown')).toBe(false);
    });

    it('should detect highlight patterns', () => {
      expect(hasTextPattern('Hello **world**', 'highlights')).toBe(true);
      expect(hasTextPattern('Hello world', 'highlights')).toBe(false);
    });

    it('should detect item key patterns', () => {
      expect(hasTextPattern('Press 道具键* to cancel', 'itemkey')).toBe(true);
      expect(hasTextPattern('Press button to cancel', 'itemkey')).toBe(false);
    });

    it('should return false for unknown patterns', () => {
      expect(hasTextPattern('Hello world', 'unknown' as never)).toBe(false);
    });
  });

  describe('extractItemKeyActions', () => {
    it('should extract action verbs from item key patterns', () => {
      const text = '道具键*打断技能释放';
      const result = extractItemKeyActions(text);
      expect(result).toEqual(['打断技能释放']);
    });

    it('should extract multiple actions', () => {
      const text = '道具键*打断（需要道具） or 道具键*取消后摇（需要道具）';
      const result = extractItemKeyActions(text);
      expect(result).toEqual(['打断', '取消后摇']);
    });

    it('should return empty array when no patterns found', () => {
      const text = 'No item key patterns here';
      const result = extractItemKeyActions(text);
      expect(result).toEqual([]);
    });

    it('should handle patterns with parentheses correctly', () => {
      const text = '道具键*打断（需要道具）';
      const result = extractItemKeyActions(text);
      expect(result).toEqual(['打断']);
    });
  });

  describe('normalizeText', () => {
    it('should trim whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeText('hello    world')).toBe('hello world');
    });

    it('should handle mixed whitespace', () => {
      expect(normalizeText('  hello  \n  world  \t  ')).toBe('hello world');
    });

    it('should return empty string for whitespace-only input', () => {
      expect(normalizeText('   \n  \t  ')).toBe('');
    });
  });
});
