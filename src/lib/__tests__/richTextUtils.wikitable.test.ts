import { wikiTextToHTML, htmlToWikiText } from '../richTextUtils';

describe('WikiTable Support', () => {
  const sampleWikiTable = `{| class="wikitable"
!
! 吃蛋糕
! 喝牛奶
! 喝药水
! 推奶酪
! 冲刺
|-
! 减少勇气积累时间/s（每次）
| 10
| 10
| 6
| 1
| ——
|-
! 延长勇气流失时间/s（每次）
| 16
| 16
| 10
| 1.6
| 2s，冲到猫/鸭子减6.5s（净减4.5s）
|}`;

  const expectedHTML = `<table class="wikitable">
<tr>
<th></th>
<th>吃蛋糕</th>
<th>喝牛奶</th>
<th>喝药水</th>
<th>推奶酪</th>
<th>冲刺</th>
</tr>
<tr>
<th>减少勇气积累时间/s（每次）</th>
<td>10</td>
<td>10</td>
<td>6</td>
<td>1</td>
<td>——</td>
</tr>
<tr>
<th>延长勇气流失时间/s（每次）</th>
<td>16</td>
<td>16</td>
<td>10</td>
<td>1.6</td>
<td>2s，冲到猫/鸭子减6.5s（净减4.5s）</td>
</tr>
</table>`;

  describe('wikiTextToHTML', () => {
    it('should convert WikiTable to HTML table', () => {
      const result = wikiTextToHTML(sampleWikiTable);
      expect(result.replace(/\s+/g, ' ').trim()).toEqual(expectedHTML.replace(/\s+/g, ' ').trim());
    });

    it('should handle table with class attribute', () => {
      const wikiTable = `{| class="wikitable"
! Header 1
! Header 2
|-
| Cell 1
| Cell 2
|}`;
      const result = wikiTextToHTML(wikiTable);
      expect(result).toContain('class="wikitable"');
      expect(result).toContain('<th>Header 1</th>');
      expect(result).toContain('<td>Cell 1</td>');
      expect(result).toContain('<td>Cell 2</td>');
    });

    it('should handle table without class', () => {
      const wikiTable = `{|
! Header 1
! Header 2
|-
| Cell 1
| Cell 2
|}`;
      const result = wikiTextToHTML(wikiTable);
      expect(result).toContain('<table>');
      expect(result).not.toContain('class=');
    });

    it('should preserve inline formatting in table cells', () => {
      const wikiTable = `{|
! '''Bold Header'''
! ''Italic Header''
|-
| __underlined text__
| ~~strikethrough text~~
|}`;
      const result = wikiTextToHTML(wikiTable);
      expect(result).toContain('<strong>Bold Header</strong>');
      expect(result).toContain('<em>Italic Header</em>');
      expect(result).toContain('<u>underlined text</u>');
      expect(result).toContain('<s>strikethrough text</s>');
    });
  });

  describe('htmlToWikiText', () => {
    it('should convert HTML table back to WikiTable', () => {
      const htmlTable = `<table class="wikitable">
<tr>
<th>Header 1</th>
<th>Header 2</th>
</tr>
<tr>
<td>Cell 1</td>
<td>Cell 2</td>
</tr>
</table>`;

      const result = htmlToWikiText(htmlTable);
      expect(result).toContain('{| class="wikitable"');
      expect(result).toContain('! Header 1');
      expect(result).toContain('! Header 2');
      expect(result).toContain('|-');
      expect(result).toContain('| Cell 1');
      expect(result).toContain('| Cell 2');
      expect(result).toContain('|}');
    });

    it('should handle table without class', () => {
      const htmlTable = `<table>
<tr>
<th>Header 1</th>
</tr>
<tr>
<td>Cell 1</td>
</tr>
</table>`;

      const result = htmlToWikiText(htmlTable);
      expect(result).toContain('{|');
      expect(result).not.toContain('class=');
    });

    it('should preserve inline formatting in converted cells', () => {
      const htmlTable = `<table>
<tr>
<th><strong>Bold Header</strong></th>
<th><em>Italic Header</em></th>
</tr>
<tr>
<td><u>underlined text</u></td>
<td><s>strikethrough text</s></td>
</tr>
</table>`;

      const result = htmlToWikiText(htmlTable);
      expect(result).toContain("! '''Bold Header'''");
      expect(result).toContain("! ''Italic Header''");
      expect(result).toContain('| __underlined text__');
      expect(result).toContain('| ~~strikethrough text~~');
    });
  });

  describe('Bidirectional conversion', () => {
    it('should maintain data integrity through round-trip conversion', () => {
      const originalWiki = `{| class="wikitable"
! Header 1
! Header 2
|-
| Cell 1
| Cell 2
|}`;

      const html = wikiTextToHTML(originalWiki);
      const backToWiki = htmlToWikiText(html);

      // Normalize whitespace for comparison
      const normalize = (text: string) => text.replace(/\s+/g, ' ').trim();

      expect(normalize(backToWiki)).toContain('{| class="wikitable"');
      expect(normalize(backToWiki)).toContain('! Header 1');
      expect(normalize(backToWiki)).toContain('! Header 2');
      expect(normalize(backToWiki)).toContain('| Cell 1');
      expect(normalize(backToWiki)).toContain('| Cell 2');
    });

    it('should handle complex table with mixed content', () => {
      const complexWiki = `{| class="wikitable"
!
! '''吃蛋糕'''
! ''喝牛奶''
|-
! __减少勇气积累时间/s（每次）__
| 10
| ~~10~~
|}`;

      const html = wikiTextToHTML(complexWiki);
      const backToWiki = htmlToWikiText(html);

      expect(backToWiki).toContain("'''吃蛋糕'''");
      expect(backToWiki).toContain("''喝牛奶''");
      expect(backToWiki).toContain('__减少勇气积累时间/s（每次）__');
      expect(backToWiki).toContain('~~10~~');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty table cells', () => {
      const wikiTable = `{|
! Header
|-
| 
|}`;
      const result = wikiTextToHTML(wikiTable);
      expect(result).toContain('<td></td>');
    });

    it('should handle tables mixed with other content', () => {
      const mixedContent = `This is a paragraph.

{| class="wikitable"
! Header
|-
| Cell
|}

Another paragraph.`;

      const result = wikiTextToHTML(mixedContent);
      expect(result).toContain('<p>This is a paragraph.</p>');
      expect(result).toContain('<table class="wikitable">');
      expect(result).toContain('<p>Another paragraph.</p>');
    });

    it('should handle malformed table gracefully', () => {
      const malformedTable = `{| class="wikitable"
! Header
| Cell without row separator
|}`;

      // Should not throw an error
      expect(() => wikiTextToHTML(malformedTable)).not.toThrow();
    });
  });
});
