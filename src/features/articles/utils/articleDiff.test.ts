import {
  articleHtmlToReadableLines,
  collapseArticleDiffRows,
  createArticleDiff,
} from './articleDiff';

describe('article diff utilities', () => {
  it('normalizes rich HTML into readable structural lines', () => {
    expect(
      articleHtmlToReadableLines(`
        <h2>玩法&nbsp;说明</h2>
        <p>第一行<br>第二行 <a href="/articles/test">链接</a></p>
        <ul><li>项目一<ul><li>子项目</li></ul></li></ul>
        <blockquote><p>引用内容</p></blockquote>
        <table><tbody><tr><th>名称</th><td>汤姆</td></tr></tbody></table>
        <p><img src="/tom.png" alt="汤姆头像"></p>
      `)
    ).toEqual([
      '玩法 说明',
      '第一行',
      '第二行 链接',
      '• 项目一',
      '  • 子项目',
      '› 引用内容',
      '名称 | 汤姆',
      '[图片: 汤姆头像]',
    ]);
  });

  it('removes unsafe and invisible markup before comparison', () => {
    expect(
      articleHtmlToReadableLines(
        '<p onclick="alert(1)"><strong>安全内容</strong></p><script>危险内容</script>'
      )
    ).toEqual(['安全内容']);
  });

  it('keeps plain text around structural content readable', () => {
    expect(articleHtmlToReadableLines('开头<p><strong>内联内容</strong></p>结尾')).toEqual([
      '开头',
      '内联内容',
      '结尾',
    ]);
  });

  it('ignores formatting-only changes', () => {
    const result = createArticleDiff('<p><strong>相同内容</strong></p>', '<p>相同内容</p>');

    expect(result.identical).toBe(true);
    expect(result.simplified).toBe(false);
  });

  it('creates paired structural rows with Chinese inline highlights', () => {
    const result = createArticleDiff(
      '<p>汤姆可以快速攻击敌人</p><p>保持不变</p>',
      '<p>汤姆可以连续攻击敌人</p><p>保持不变</p><p>新增说明</p>'
    );

    expect(result.identical).toBe(false);
    expect(result.rows.map((row) => row.kind)).toEqual(['changed', 'context', 'added']);
    expect(result.rows[0]?.oldSegments.some((segment) => segment.kind === 'removed')).toBe(true);
    expect(result.rows[0]?.newSegments.some((segment) => segment.kind === 'added')).toBe(true);
    expect(result.rows[2]).toMatchObject({
      oldLineNumber: null,
      newLineNumber: 3,
      newText: '新增说明',
    });
  });

  it('collapses long unchanged regions and expands a selected gap', () => {
    const oldContent = Array.from({ length: 10 }, (_, index) => `<p>段落 ${index}</p>`).join('');
    const newContent = oldContent.replace('段落 5', '修改后的段落 5');
    const result = createArticleDiff(oldContent, newContent);
    const collapsed = collapseArticleDiffRows(result.rows, new Set(), 2);
    const gaps = collapsed.filter((item) => item.type === 'gap');

    expect(gaps).toHaveLength(2);
    const firstGap = gaps[0]!;
    if (firstGap.type !== 'gap') throw new Error('Expected a collapsed gap');

    const expanded = collapseArticleDiffRows(result.rows, new Set([firstGap.id]), 2);
    expect(expanded.filter((item) => item.type === 'gap')).toHaveLength(1);
    expect(expanded.length).toBeGreaterThan(collapsed.length);
  });

  it('renders a short unchanged run only once when context ranges overlap', () => {
    const result = createArticleDiff(
      '<p>删除前</p><p>唯一的未更改行</p><p>删除后</p>',
      '<p>新增前</p><p>唯一的未更改行</p><p>新增后</p>'
    );
    const displayItems = collapseArticleDiffRows(result.rows, new Set(), 3);
    const matchingRows = displayItems.filter(
      (item) => item.type === 'row' && item.row.oldText === '唯一的未更改行'
    );

    expect(matchingRows).toHaveLength(1);
  });

  it('handles empty revisions', () => {
    expect(createArticleDiff(null, undefined)).toEqual({
      rows: [],
      identical: true,
      simplified: false,
    });
  });
});
