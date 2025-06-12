import React from 'react';
import {
  renderTextWithHighlights,
  formatTextWithEnhancedMarkdown,
  hasTextPattern,
  extractItemKeyActions,
  normalizeText,
} from '../textUtils';
import { render } from '@testing-library/react';

describe('textUtils', () => {
  describe('renderTextWithHighlights', () => {
    it('should render plain text without highlights', () => {
      const result = renderTextWithHighlights('Hello world');
      expect(result).toEqual(['Hello world']);
    });

    it('should render text with bold markdown highlights', () => {
      const result = renderTextWithHighlights('Hello **world** test');
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Hello ');
      expect(result[2]).toBe(' test');
      // Check that the highlighted part is a React element
      const highlightedElement = result[1] as React.ReactElement;
      expect(React.isValidElement(highlightedElement)).toBe(true);
      expect((highlightedElement.props as Record<string, unknown>).className).toBe(
        'underline decoration-2 underline-offset-2'
      );
      expect((highlightedElement.props as Record<string, unknown>).children).toBe('world');
    });

    it('should handle multiple highlights', () => {
      const result = renderTextWithHighlights('**First** and **Second** highlights');
      expect(result).toHaveLength(4);
      expect(result[1]).toBe(' and ');
      expect(result[3]).toBe(' highlights');
    });
  });

  describe('formatTextWithEnhancedMarkdown', () => {
    it('should format text with bold markdown', () => {
      const result = formatTextWithEnhancedMarkdown('Hello **world**');
      const { container } = render(result);

      expect(container.textContent).toBe('Hello world');
      const underlinedElement = container.querySelector('.underline');
      expect(underlinedElement?.textContent).toBe('world');
    });

    it('should format text with numerical patterns', () => {
      const result = formatTextWithEnhancedMarkdown('Damage: 50点 for 3秒');
      const { container } = render(result);

      expect(container.textContent).toBe('Damage: 50点 for 3秒');
      const underlinedElements = container.querySelectorAll('.underline');
      expect(underlinedElements).toHaveLength(2);
      expect(underlinedElements[0].textContent).toBe('50点');
      expect(underlinedElements[1].textContent).toBe('3秒');
    });

    it('should format percentage values', () => {
      const result = formatTextWithEnhancedMarkdown('Increase by 25%');
      const { container } = render(result);

      const underlinedElement = container.querySelector('.underline');
      expect(underlinedElement?.textContent).toBe('25%');
    });

    it('should handle mixed formatting', () => {
      const result = formatTextWithEnhancedMarkdown('**Skill** deals 100点 damage');
      const { container } = render(result);

      const underlinedElements = container.querySelectorAll('.underline');
      expect(underlinedElements).toHaveLength(2);
      expect(underlinedElements[0].textContent).toBe('Skill');
      expect(underlinedElements[1].textContent).toBe('100点');
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
