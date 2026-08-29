import { stat } from 'node:fs/promises';
import path from 'node:path';

const USAGE_ARTICLES_DIRECTORY = path.join('src', 'features', 'usages', 'articles');

function formatDate(date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    day: 'numeric',
    month: 'numeric',
    timeZone: 'Asia/Hong_Kong',
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}.${values.month}.${values.day}`;
}

export default function remarkUsageLastUpdated() {
  return async (tree, file) => {
    if (!file.path || !path.normalize(file.path).includes(USAGE_ARTICLES_DIRECTORY)) {
      return;
    }

    const headingIndex = tree.children.findIndex(
      (node) => node.type === 'heading' && node.depth === 1
    );
    if (headingIndex === -1) {
      return;
    }

    const { mtime } = await stat(file.path);
    tree.children.splice(headingIndex + 1, 0, {
      type: 'paragraph',
      children: [{ type: 'text', value: `（最后更新：${formatDate(mtime)}）` }],
    });
  };
}
