import { htmlToWikiText, wikiTextToHTML } from '../richTextUtils';

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

    it('should handle WikiText with newlines that comes from HTML conversion', () => {
      // Simulate what happens when HTML is converted back to WikiText (which adds newlines)
      const originalWiki = `{| class="wikitable"
! Header 1
! Header 2
|-
| Cell 1
| Cell 2
|}`;

      const html = wikiTextToHTML(originalWiki);
      const wikiWithNewlines = htmlToWikiText(html);

      // The wikiWithNewlines might have extra newlines, but should still parse correctly
      const htmlAgain = wikiTextToHTML(wikiWithNewlines);

      expect(htmlAgain).toContain('<table class="wikitable">');
      expect(htmlAgain).toContain('<th>Header 1</th>');
      expect(htmlAgain).toContain('<td>Cell 1</td>');

      // Should not treat table syntax as paragraphs
      expect(htmlAgain).not.toContain('<p>{|');
      expect(htmlAgain).not.toContain('<p>!</p>');
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

    it('should handle mixed content with text before tables', () => {
      const mixedContent = `数据由隔壁老米测试。注：勇气值自然积累需要27s回满、自然消耗需要50s耗完。

{| class="wikitable"
!
! 吃蛋糕
! 喝牛奶
|-
! 减少勇气积累时间/s（每次）
| 10
| 10
|}`;

      const result = wikiTextToHTML(mixedContent);
      expect(result).toContain(
        '<p>数据由隔壁老米测试。注：勇气值自然积累需要27s回满、自然消耗需要50s耗完。</p>'
      );
      expect(result).toContain('<table class="wikitable">');
      expect(result).toContain('<th>吃蛋糕</th>');
      expect(result).toContain('<td>10</td>');
      // Should NOT contain table syntax as plain text
      expect(result).not.toContain('<p>{| class="wikitable"</p>');
    });

    it('should parse tables with extra newlines between elements', () => {
      const tableWithNewlines = `{| class="wikitable"

!

! 吃蛋糕

! 喝牛奶

|-

! 减少勇气积累时间/s（每次）

| 10

| 10

|}`;

      const result = wikiTextToHTML(tableWithNewlines);
      expect(result).toContain('<table class="wikitable">');
      expect(result).toContain('<th>吃蛋糕</th>');
      expect(result).toContain('<td>10</td>');
    });

    it('should handle the exact user input case', () => {
      const userInput = `数据由隔壁老米测试。注：勇气值自然积累需要27s回满、自然消耗需要50s耗完。

{| class="wikitable"
!
! 吃蛋糕
! 喝牛奶
! 喝药水
! 推奶酪
! 冲刺
! 冰水
! 胡椒粉
|-
! 减少勇气积累时间/s（每次）
| 10
| 10
| 6
| 1
| ——
| 1.6
| 2
| 2
|-
! 延长勇气流失时间/s（每次）
| 16
| 16
| 10
| 1.6
| 2s，冲到猫/鸭子减6.5s（净减4.5s）
| 4.6
| 3.2
| 3.2
|}`;

      const result = wikiTextToHTML(userInput);

      // Should contain proper HTML table
      expect(result).toContain('<table class="wikitable">');
      expect(result).toContain('<th>吃蛋糕</th>');
      expect(result).toContain('<td>10</td>');

      // Should NOT contain table syntax as plain text paragraphs
      expect(result).not.toContain('<p>{| class="wikitable"</p>');
      expect(result).not.toContain('<p>!</p>');
      expect(result).not.toContain('<p>|-</p>');
    });

    it('should handle tables that get regenerated with extra newlines', () => {
      // This simulates the case where HTML is converted back to WikiText with extra newlines
      const tableWithExtraNewlines = `{| class="wikitable"

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

      const result = wikiTextToHTML(tableWithExtraNewlines);

      // Should still parse correctly
      expect(result).toContain('<table class="wikitable">');
      expect(result).toContain('<th>吃蛋糕</th>');
      expect(result).toContain('<td>10</td>');
      expect(result).toContain('<td>2s，冲到猫/鸭子减6.5s（净减4.5s）</td>');
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

    it('should handle various line ending formats', () => {
      // Test with Windows line endings (\r\n)
      const windowsLineEndings =
        '{| class="wikitable"\r\n!\r\n! Header 1\r\n! Header 2\r\n|-\r\n| Cell 1\r\n| Cell 2\r\n|}';
      const windowsResult = wikiTextToHTML(windowsLineEndings);
      expect(windowsResult).toContain('<table class="wikitable">');
      expect(windowsResult).toContain('<th>Header 1</th>');

      // Test with mixed line endings
      const mixedLineEndings =
        '{| class="wikitable"\n!\r\n! Header 1\n! Header 2\r\n|-\n| Cell 1\r\n| Cell 2\n|}';
      const mixedResult = wikiTextToHTML(mixedLineEndings);
      expect(mixedResult).toContain('<table class="wikitable">');
      expect(mixedResult).toContain('<th>Header 1</th>');
    });

    it('should convert wiki links at start-of-line and preserve spaces in HTML (round-trip may trim)', () => {
      const samples = [
        '[https://example.com 示例]',
        ' [https://example.com 示例]',
        '   [https://example.com 示例]',
      ];

      const results = samples.map((s) => wikiTextToHTML(s));

      expect(results[0]).toBe('<p><a href="https://example.com">示例</a></p>');
      expect(results[1]).toBe('<p> <a href="https://example.com">示例</a></p>');
      expect(results[2]).toBe('<p>   <a href="https://example.com">示例</a></p>');

      // Round-trip back to wikitext keeps the link; leading spaces may be trimmed by final .trim()
      const back = results.map((html) => htmlToWikiText(html));
      expect(back[0]).toMatch(/^\s*\[https:\/\/example\.com 示例\]\s*$/);
      expect(back[1]).toMatch(/^\s*\[https:\/\/example\.com 示例\]\s*$/);
      expect(back[2]).toMatch(/^\s*\[https:\/\/example\.com 示例\]\s*$/);
    });

    it('should convert wiki links inside table cells including at cell start', () => {
      const wikiTableWithLinks = `{|
! 资源
|-
| [https://ex.com 链接一]
| [https://ex2.com 链接二]
|}`;

      const html = wikiTextToHTML(wikiTableWithLinks);
      expect(html).toContain('<td><a href="https://ex.com">链接一</a></td>');
      expect(html).toContain('<td><a href="https://ex2.com">链接二</a></td>');

      const back = htmlToWikiText(html);
      expect(back).toMatch(/\|\s+\[https:\/\/ex\.com 链接一\]/);
      expect(back).toMatch(/\|\s+\[https:\/\/ex2\.com 链接二\]/);
    });
  });
});
