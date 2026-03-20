import { NextRequest, NextResponse } from 'next/server';
import * as ts from 'typescript';

import { requireRole } from '@/lib/auth/requireRole';
import type { Action } from '@/lib/edit/diffUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PROJECT_INFO } from '@/constants';
import { cards, characters } from '@/data';
import { env } from '@/env';

type EntityFileConfig = {
  path: string;
  rootObject: string;
  faction?: 'cat' | 'mouse';
};

/**
 * Maps entity_type to data definition files and their root objects.
 * Paths are relative to the repository root.
 */
const ENTITY_FILE_CONFIGS: Record<string, EntityFileConfig[]> = {
  characters: [
    {
      path: 'src/features/characters/data/catCharacters.ts',
      rootObject: 'catCharacterDefinitions',
      faction: 'cat',
    },
    {
      path: 'src/features/characters/data/mouseCharacters.ts',
      rootObject: 'mouseCharacterDefinitions',
      faction: 'mouse',
    },
  ],
  cards: [
    {
      path: 'src/features/knowledge-cards/data/catKnowledgeCards.ts',
      rootObject: 'catKnowledgeCards',
      faction: 'cat',
    },
    {
      path: 'src/features/knowledge-cards/data/mouseKnowledgeCards.ts',
      rootObject: 'mouseKnowledgeCards',
      faction: 'mouse',
    },
  ],
  entities: [{ path: 'src/features/entities/data/entities.ts', rootObject: 'entityDefinitions' }],
  buffs: [{ path: 'src/features/buffs/data/buffs.ts', rootObject: 'buffDefinitions' }],
  items: [{ path: 'src/features/items/data/items.ts', rootObject: 'itemDefinitions' }],
  fixtures: [{ path: 'src/features/fixtures/data/fixtures.ts', rootObject: 'FixtureDefinitions' }],
  maps: [{ path: 'src/data/maps.ts', rootObject: 'mapDefinitions' }],
  modes: [{ path: 'src/features/modes/data/modes.ts', rootObject: 'ModeDefinitions' }],
  achievements: [{ path: 'src/data/achievements.ts', rootObject: 'achievementDefinitions' }],
  specialSkills: [
    {
      path: 'src/features/special-skills/data/catSpecialSkills.ts',
      rootObject: 'catSpecialSkillDefinitions',
      faction: 'cat',
    },
    {
      path: 'src/features/special-skills/data/mouseSpecialSkills.ts',
      rootObject: 'mouseSpecialSkillDefinitions',
      faction: 'mouse',
    },
  ],
};

interface GitHubRef {
  object: { sha: string };
}

interface GitHubCommitData {
  sha: string;
  tree: { sha: string };
}

interface GitHubTreeData {
  sha: string;
}

interface GitHubBlobData {
  sha: string;
}

interface GitHubPRData {
  html_url: string;
  number: number;
}

interface ActionRow {
  id: string;
  entity_type: string;
  entry: unknown;
  created_at: string;
}

interface ActionSyncStats {
  expected: number;
  succeeded: number;
  failed: number;
}

function parseOwnerRepo(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1]!, repo: match[2]!.replace(/\.git$/, '') };
}

function flattenEntry(raw: unknown): Action[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    // Could be Action[] or ActionHistoryEntry[]
    const result: Action[] = [];
    for (const item of raw) {
      if (item && typeof item === 'object' && 'op' in item && 'path' in item) {
        result.push(item as Action);
      } else if (Array.isArray(item)) {
        result.push(...flattenEntry(item));
      }
    }
    return result;
  }
  if (typeof raw === 'object' && 'op' in raw && 'path' in raw) {
    return [raw as Action];
  }
  return [];
}

function formatCommitMessage(entityType: string, action: Action): string {
  const path = action.path;
  if (action.op === 'delete') {
    return `docs(${entityType}): remove ${path}`;
  }
  const newVal =
    typeof action.newValue === 'string'
      ? action.newValue
      : (JSON.stringify(action.newValue) ?? 'undefined');
  const truncated = newVal.length > 60 ? newVal.slice(0, 57) + '...' : newVal;
  return `docs(${entityType}): update ${path} to ${truncated}`;
}

async function githubApi<T>(
  path: string,
  options: { method?: string; body?: unknown; token: string }
): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${options.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : null,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub API ${options.method ?? 'GET'} ${path} failed (${res.status}): ${text}`
    );
  }

  return res.json() as Promise<T>;
}

function getDataFileConfigs(entityType: string): EntityFileConfig[] {
  return ENTITY_FILE_CONFIGS[entityType] ?? [];
}

function getCandidateFileConfigs(entityType: string, actionPath: string): EntityFileConfig[] {
  const configs = getDataFileConfigs(entityType);
  if (configs.length === 0) return [];
  const parts = actionPath.split('.').filter(Boolean);
  if (parts.length === 0) return configs;

  if (entityType === 'specialSkills') {
    const faction = parts[0];
    if (faction === 'cat' || faction === 'mouse') {
      const filtered = configs.filter((config) => config.faction === faction);
      return filtered.length > 0 ? filtered : configs;
    }
    return configs;
  }

  if (entityType === 'characters') {
    const characterId = parts[0];
    if (!characterId) return configs;
    const factionId = characters[characterId]?.factionId;
    if (factionId === 'cat' || factionId === 'mouse') {
      const filtered = configs.filter((config) => config.faction === factionId);
      return filtered.length > 0 ? filtered : configs;
    }
  }

  if (entityType === 'cards') {
    const cardId = parts[0];
    if (!cardId) return configs;
    const factionId = cards[cardId]?.factionId;
    if (factionId === 'cat' || factionId === 'mouse') {
      const filtered = configs.filter((config) => config.faction === factionId);
      return filtered.length > 0 ? filtered : configs;
    }
  }

  return configs;
}

function resolveActionPathForConfig(
  entityType: string,
  actionPath: string,
  config: EntityFileConfig
): string {
  if (!actionPath) return actionPath;
  if (entityType !== 'specialSkills') return actionPath;

  const parts = actionPath.split('.').filter(Boolean);
  if (parts.length < 2) return actionPath;

  const [faction, ...rest] = parts;
  if (faction === 'cat' || faction === 'mouse') {
    if (!config.faction || config.faction === faction) {
      return rest.join('.');
    }
  }

  return actionPath;
}

type PathTarget = {
  parent: ts.ObjectLiteralExpression | ts.ArrayLiteralExpression;
  key: string;
  valueNode?: ts.Expression;
  propertyNode?: ts.ObjectLiteralElementLike;
};

function unwrapExpression(expression: ts.Expression): ts.Expression {
  let current = expression;
  while (true) {
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isAsExpression(current) || ts.isTypeAssertionExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isSatisfiesExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isNonNullExpression(current)) {
      current = current.expression;
      continue;
    }
    break;
  }
  return current;
}

function getPropertyNameText(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function getPropertyValue(property: ts.ObjectLiteralElementLike): ts.Expression | null {
  if (ts.isPropertyAssignment(property)) return property.initializer;
  if (ts.isShorthandPropertyAssignment(property)) return property.name;
  return null;
}

function findRootObjectLiteral(
  sourceFile: ts.SourceFile,
  rootObjectName: string
): ts.ObjectLiteralExpression | null {
  let found: ts.ObjectLiteralExpression | null = null;

  const visit = (node: ts.Node) => {
    if (found) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === rootObjectName && node.initializer) {
        const expr = unwrapExpression(node.initializer);
        if (ts.isObjectLiteralExpression(expr)) {
          found = expr;
          return;
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return found;
}

function findObjectProperty(
  objectLiteral: ts.ObjectLiteralExpression,
  key: string
): ts.ObjectLiteralElementLike | null {
  for (const prop of objectLiteral.properties) {
    if (
      ts.isPropertyAssignment(prop) ||
      ts.isShorthandPropertyAssignment(prop) ||
      ts.isMethodDeclaration(prop)
    ) {
      const nameText = getPropertyNameText(prop.name);
      if (nameText === key) return prop;
    }
  }
  return null;
}

function findPathTarget(root: ts.ObjectLiteralExpression, pathParts: string[]): PathTarget | null {
  let current: ts.Expression = root;

  for (let i = 0; i < pathParts.length; i++) {
    const key = pathParts[i]!;
    const isLast = i === pathParts.length - 1;

    if (ts.isObjectLiteralExpression(current)) {
      const prop = findObjectProperty(current, key);
      if (!prop) {
        return isLast ? { parent: current, key } : null;
      }
      const value = getPropertyValue(prop);
      if (isLast) {
        const target: PathTarget = { parent: current, key, propertyNode: prop };
        if (value) target.valueNode = value;
        return target;
      }
      if (!value) return null;
      const next = unwrapExpression(value);
      if (!ts.isObjectLiteralExpression(next) && !ts.isArrayLiteralExpression(next)) return null;
      current = next;
      continue;
    }

    if (ts.isArrayLiteralExpression(current)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0) return null;
      if (index > current.elements.length) return null;
      const element = current.elements[index];
      if (!element || ts.isOmittedExpression(element)) {
        return isLast ? { parent: current, key } : null;
      }
      if (isLast) {
        return { parent: current, key, valueNode: element as ts.Expression };
      }
      const next = unwrapExpression(element as ts.Expression);
      if (!ts.isObjectLiteralExpression(next) && !ts.isArrayLiteralExpression(next)) return null;
      current = next;
      continue;
    }

    return null;
  }

  return null;
}

function buildNestedValue(pathParts: string[], value: unknown): unknown {
  if (pathParts.length === 0) return value;
  const [head, ...rest] = pathParts;
  const nextValue = buildNestedValue(rest, value);
  if (head && /^[0-9]+$/.test(head)) {
    const index = Number(head);
    if (!Number.isInteger(index) || index < 0) return { [head]: nextValue };
    const result: unknown[] = [];
    result[index] = nextValue;
    return result;
  }
  return { [head ?? '']: nextValue };
}

function findPathTargetForSet(
  root: ts.ObjectLiteralExpression,
  pathParts: string[],
  value: unknown
): { target: PathTarget; value: unknown } | null {
  let current: ts.Expression = root;

  for (let i = 0; i < pathParts.length; i++) {
    const key = pathParts[i] ?? '';
    const isLast = i === pathParts.length - 1;

    if (ts.isObjectLiteralExpression(current)) {
      const prop = findObjectProperty(current, key);
      if (!prop) {
        const nested = buildNestedValue(pathParts.slice(i + 1), value);
        return { target: { parent: current, key }, value: nested };
      }
      const propValue = getPropertyValue(prop);
      if (isLast) {
        const target: PathTarget = { parent: current, key, propertyNode: prop };
        if (propValue) target.valueNode = propValue;
        return { target, value };
      }
      if (!propValue) return null;
      const next = unwrapExpression(propValue);
      if (!ts.isObjectLiteralExpression(next) && !ts.isArrayLiteralExpression(next)) {
        const nested = buildNestedValue(pathParts.slice(i + 1), value);
        return {
          target: { parent: current, key, propertyNode: prop, valueNode: propValue },
          value: nested,
        };
      }
      current = next;
      continue;
    }

    if (ts.isArrayLiteralExpression(current)) {
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0) return null;
      if (index > current.elements.length) return null;
      const element = current.elements[index];
      if (!element || ts.isOmittedExpression(element)) {
        if (isLast) return { target: { parent: current, key }, value };
        const nested = buildNestedValue(pathParts.slice(i + 1), value);
        return { target: { parent: current, key }, value: nested };
      }
      if (isLast) {
        return { target: { parent: current, key, valueNode: element as ts.Expression }, value };
      }
      const next = unwrapExpression(element as ts.Expression);
      if (!ts.isObjectLiteralExpression(next) && !ts.isArrayLiteralExpression(next)) {
        const nested = buildNestedValue(pathParts.slice(i + 1), value);
        return {
          target: { parent: current, key, valueNode: element as ts.Expression },
          value: nested,
        };
      }
      current = next;
      continue;
    }

    return null;
  }

  return null;
}

function detectIndentUnit(content: string): string {
  const lines = content.split('\n');
  let minIndent: number | null = null;

  for (const line of lines) {
    if (/^\t+\S/.test(line)) return '\t';
    const match = line.match(/^( +)\S/);
    if (!match) continue;
    const indent = match[1];
    if (!indent) continue;
    const len = indent.length;
    if (len === 0) continue;
    if (minIndent === null || len < minIndent) minIndent = len;
  }

  return minIndent ? ' '.repeat(minIndent) : '  ';
}

function getIndentationAtPosition(content: string, pos: number): string {
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  const line = content.slice(lineStart, pos);
  const match = line.match(/^[\t ]*/);
  return match ? match[0] : '';
}

function escapeString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function serializeObjectKey(key: string): string {
  if (/^[$A-Z_][0-9A-Z_$]*$/i.test(key)) return key;
  return `'${escapeString(key)}'`;
}

function serializeValue(value: unknown, indentUnit: string, baseIndent: string): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `'${escapeString(value)}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const nextIndent = baseIndent + indentUnit;
    const items = value.map((item) => serializeValue(item, indentUnit, nextIndent));
    return `[${items.join(', ')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const nextIndent = baseIndent + indentUnit;
    const lines = entries.map(
      ([key, val]) =>
        `${nextIndent}${serializeObjectKey(key)}: ${serializeValue(val, indentUnit, nextIndent)}`
    );
    return `{\n${lines.join(',\n')}\n${baseIndent}}`;
  }

  return String(value);
}

function replaceRange(content: string, start: number, end: number, replacement: string): string {
  return content.slice(0, start) + replacement + content.slice(end);
}

function insertObjectProperty(
  content: string,
  sourceFile: ts.SourceFile,
  objectLiteral: ts.ObjectLiteralExpression,
  key: string,
  value: unknown,
  indentUnit: string
): string | null {
  const objectIndent = getIndentationAtPosition(content, objectLiteral.getStart(sourceFile));
  const propertyIndent = objectIndent + indentUnit;
  const serialized = serializeValue(value, indentUnit, propertyIndent);
  const propertyText = `${serializeObjectKey(key)}: ${serialized}`;
  const insertPos = objectLiteral.getEnd() - 1;

  if (objectLiteral.properties.length === 0) {
    const insertText = `\n${propertyIndent}${propertyText}\n${objectIndent}`;
    return replaceRange(content, insertPos, insertPos, insertText);
  }

  const lastProp = objectLiteral.properties[objectLiteral.properties.length - 1];
  if (!lastProp) return null;
  const between = content.slice(lastProp.getEnd(), insertPos);
  const needsComma = !between.includes(',');
  const insertText = `${needsComma ? ',' : ''}\n${propertyIndent}${propertyText}\n${objectIndent}`;
  return replaceRange(content, insertPos, insertPos, insertText);
}

function insertArrayElement(
  content: string,
  sourceFile: ts.SourceFile,
  arrayLiteral: ts.ArrayLiteralExpression,
  index: number,
  value: unknown,
  indentUnit: string
): string | null {
  if (index < 0 || index > arrayLiteral.elements.length) return null;

  const arrayIndent = getIndentationAtPosition(content, arrayLiteral.getStart(sourceFile));
  const elementIndent = arrayIndent + indentUnit;
  const serialized = serializeValue(value, indentUnit, elementIndent);

  if (arrayLiteral.elements.length === 0 || index === arrayLiteral.elements.length) {
    const insertPos = arrayLiteral.getEnd() - 1;
    const insertText =
      arrayLiteral.elements.length === 0
        ? `\n${elementIndent}${serialized}\n${arrayIndent}`
        : `,\n${elementIndent}${serialized}\n${arrayIndent}`;
    return replaceRange(content, insertPos, insertPos, insertText);
  }

  const targetElem = arrayLiteral.elements[index];
  if (!targetElem || ts.isOmittedExpression(targetElem)) return null;
  const insertPos = targetElem.getStart(sourceFile);
  const insertText = `${serialized},\n${elementIndent}`;
  return replaceRange(content, insertPos, insertPos, insertText);
}

function setAtTarget(
  content: string,
  sourceFile: ts.SourceFile,
  target: PathTarget,
  value: unknown,
  indentUnit: string
): string | null {
  if (value === undefined) {
    return deleteAtTarget(content, sourceFile, target);
  }
  if (target.valueNode) {
    const baseIndent = getIndentationAtPosition(content, target.valueNode.getStart(sourceFile));
    const serialized = serializeValue(value, indentUnit, baseIndent);
    return replaceRange(
      content,
      target.valueNode.getStart(sourceFile),
      target.valueNode.getEnd(),
      serialized
    );
  }

  if (ts.isObjectLiteralExpression(target.parent)) {
    return insertObjectProperty(content, sourceFile, target.parent, target.key, value, indentUnit);
  }

  if (ts.isArrayLiteralExpression(target.parent)) {
    const index = Number(target.key);
    if (!Number.isInteger(index)) return null;
    return insertArrayElement(content, sourceFile, target.parent, index, value, indentUnit);
  }

  return null;
}

function deleteAtTarget(
  content: string,
  sourceFile: ts.SourceFile,
  target: PathTarget
): string | null {
  if (ts.isObjectLiteralExpression(target.parent)) {
    if (!target.propertyNode) return null;
    const start = target.propertyNode.getStart(sourceFile);
    let end = target.propertyNode.getEnd();
    const after = content.slice(end, target.parent.getEnd());
    const match = after.match(/^\s*,/);
    if (match) end += match[0].length;
    return replaceRange(content, start, end, '');
  }

  if (ts.isArrayLiteralExpression(target.parent)) {
    if (!target.valueNode) return null;
    const start = target.valueNode.getStart(sourceFile);
    let end = target.valueNode.getEnd();
    const after = content.slice(end, target.parent.getEnd());
    const match = after.match(/^\s*,/);
    if (match) end += match[0].length;
    return replaceRange(content, start, end, '');
  }

  return null;
}

/**
 * Apply a single Action to a TS source file's content string.
 * Uses TypeScript AST traversal to locate the target path and update values.
 * Returns the modified content, or null if the path couldn't be located.
 */
function applyActionToFileContent(
  content: string,
  action: Action,
  config: EntityFileConfig
): string | null {
  const pathParts = action.path.split('.').filter(Boolean);
  if (pathParts.length === 0) return null;

  const sourceFile = ts.createSourceFile(
    config.path,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const rootObject = findRootObjectLiteral(sourceFile, config.rootObject);
  if (!rootObject) return null;

  const target = findPathTarget(rootObject, pathParts);
  if (!target) return null;

  if (action.op === 'delete') {
    return deleteAtTarget(content, sourceFile, target);
  }

  const resolved = findPathTargetForSet(rootObject, pathParts, action.newValue);
  if (!resolved) return null;
  if (resolved.target.propertyNode && !resolved.target.valueNode) return null;

  const indentUnit = detectIndentUnit(content);
  return setAtTarget(content, sourceFile, resolved.target, resolved.value, indentUnit);
}

function resolveActionPathForFile(
  entityType: string,
  actionPath: string,
  filePath: string
): string {
  const configs = getDataFileConfigs(entityType);
  if (configs.length === 0) return actionPath;
  const match = configs.find((config) => config.path === filePath);
  if (!match) return actionPath;
  return resolveActionPathForConfig(entityType, actionPath, match);
}

interface SyncRequestBody {
  actionIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireRole(['Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;

    const token = env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: 'GITHUB_TOKEN is not configured on the server' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as SyncRequestBody;
    const { actionIds } = body;

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json({ error: 'actionIds must be a non-empty array' }, { status: 400 });
    }

    // Fetch the selected approved actions from Supabase
    const { data: actions, error: fetchError } = await supabaseAdmin
      .from('game_data_actions')
      .select('id, entity_type, entry, created_at')
      .in('id', actionIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching actions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    if (!actions || actions.length === 0) {
      return NextResponse.json(
        { error: 'No approved actions found for the given IDs' },
        { status: 404 }
      );
    }
    const orderedActions = actions as ActionRow[];
    const approvedActionIds = Array.from(new Set(orderedActions.map((action) => action.id)));

    const { owner, repo } = parseOwnerRepo(PROJECT_INFO.url);
    const baseBranch = 'develop';

    // 1. Get the SHA of the develop branch
    const refData = await githubApi<GitHubRef>(
      `/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      { token }
    );
    const baseSha = refData.object.sha;

    // 2. Create a new branch: doc-update-<timestamp>
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, 19);
    const newBranch = `doc-update-${timestamp}`;

    await githubApi(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: { ref: `refs/heads/${newBranch}`, sha: baseSha },
      token,
    });

    // 3. Create commits for each action
    let currentSha = baseSha;
    const commitResults: Array<{ actionId: string; commitSha: string; message: string }> = [];
    const failedActions: Array<{ actionId: string; reason: string }> = [];
    const actionStats = new Map<string, ActionSyncStats>();

    // Get the base tree
    const baseCommit = await githubApi<GitHubCommitData>(
      `/repos/${owner}/${repo}/git/commits/${baseSha}`,
      { token }
    );
    let currentTreeSha = baseCommit.tree.sha;

    // Cache fetched file contents to avoid redundant API calls
    const fileContentCache = new Map<string, string>();

    for (const actionRow of orderedActions) {
      const flatActions = flattenEntry(actionRow.entry);
      actionStats.set(actionRow.id, {
        expected: flatActions.length,
        succeeded: 0,
        failed: 0,
      });
      const stats = actionStats.get(actionRow.id)!;
      if (flatActions.length === 0) {
        stats.failed += 1;
        failedActions.push({ actionId: actionRow.id, reason: 'No actions found in entry' });
        continue;
      }

      // Process each flat action as a separate commit
      for (const action of flatActions) {
        const commitMessage = formatCommitMessage(actionRow.entity_type, action);
        let committed = false;
        const configs = getCandidateFileConfigs(actionRow.entity_type, action.path);
        if (configs.length === 0) {
          stats.failed += 1;
          failedActions.push({
            actionId: actionRow.id,
            reason: `Unknown entity type: ${actionRow.entity_type}`,
          });
          continue;
        }

        const filePaths = configs.map((config) => config.path);

        // Try each file path until we find one where the path exists
        for (const filePath of filePaths) {
          try {
            // Fetch file content (use cache if available)
            let fileContent = fileContentCache.get(filePath);
            if (fileContent === undefined) {
              const fileData = await githubApi<{ content: string; encoding: string }>(
                `/repos/${owner}/${repo}/contents/${filePath}?ref=${newBranch}`,
                { token }
              );
              fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8');
              fileContentCache.set(filePath, fileContent);
            }

            // Apply the action to the file content
            const resolvedPath = resolveActionPathForFile(
              actionRow.entity_type,
              action.path,
              filePath
            );
            const actionToApply =
              resolvedPath === action.path ? action : { ...action, path: resolvedPath };
            const config = configs.find((candidate) => candidate.path === filePath) ?? configs[0]!;
            if (!config) continue;
            const modified = applyActionToFileContent(fileContent, actionToApply, config);
            if (!modified || modified === fileContent) continue;

            // Create a blob with the new content
            const blobData = await githubApi<GitHubBlobData>(`/repos/${owner}/${repo}/git/blobs`, {
              method: 'POST',
              body: { content: modified, encoding: 'utf-8' },
              token,
            });

            // Create a tree with the updated file
            const treeData = await githubApi<GitHubTreeData>(`/repos/${owner}/${repo}/git/trees`, {
              method: 'POST',
              body: {
                base_tree: currentTreeSha,
                tree: [
                  {
                    path: filePath,
                    mode: '100644',
                    type: 'blob',
                    sha: blobData.sha,
                  },
                ],
              },
              token,
            });

            // Create a commit
            const commitData = await githubApi<GitHubCommitData>(
              `/repos/${owner}/${repo}/git/commits`,
              {
                method: 'POST',
                body: {
                  message: commitMessage,
                  tree: treeData.sha,
                  parents: [currentSha],
                },
                token,
              }
            );

            currentSha = commitData.sha;
            currentTreeSha = treeData.sha;
            fileContentCache.set(filePath, modified);

            commitResults.push({
              actionId: actionRow.id,
              commitSha: commitData.sha,
              message: commitMessage,
            });
            stats.succeeded += 1;
            committed = true;
            break;
          } catch (err) {
            // Try next file path
            console.error(`Failed to apply action to ${filePath}:`, err);
            continue;
          }
        }

        if (!committed) {
          stats.failed += 1;
          failedActions.push({
            actionId: actionRow.id,
            reason: `Could not apply action path "${action.path}" to any data file`,
          });
        }
      }
    }

    if (commitResults.length === 0) {
      // Clean up the branch if no commits were made
      try {
        await githubApi(`/repos/${owner}/${repo}/git/refs/heads/${newBranch}`, {
          method: 'DELETE',
          token,
        });
      } catch {
        // Ignore cleanup errors
      }
      return NextResponse.json(
        {
          error: 'No commits could be created',
          failedActions,
        },
        { status: 422 }
      );
    }

    // 4. Update the branch ref to point to the latest commit
    await githubApi(`/repos/${owner}/${repo}/git/refs/heads/${newBranch}`, {
      method: 'PATCH',
      body: { sha: currentSha },
      token,
    });

    // 5. Create the pull request
    const prBody = [
      '## Data Sync',
      '',
      `Pull Request Automatically Generated, including ${commitResults.length} game data update${commitResults.length > 1 ? 's' : ''}.`,
      '',
      '### Commit List',
      '',
      ...commitResults.map(
        (c) => `- \`${c.commitSha.slice(0, 7)}\` ${c.message} (action: ${c.actionId})`
      ),
      ...(failedActions.length > 0
        ? [
            '',
            '### Failed Actions',
            '',
            ...failedActions.map((f) => `- ${f.actionId}: ${f.reason}`),
          ]
        : []),
    ].join('\n');

    const prData = await githubApi<GitHubPRData>(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: {
        title: `docs: sync ${commitResults.length} game data update${commitResults.length > 1 ? 's' : ''}`,
        body: prBody,
        head: newBranch,
        base: baseBranch,
      },
      token,
    });

    const fullySyncedIds = approvedActionIds.filter((actionId) => {
      const stats = actionStats.get(actionId);
      return (
        !!stats && stats.expected > 0 && stats.failed === 0 && stats.succeeded === stats.expected
      );
    });

    let syncedActionIds: string[] = [];
    let statusUpdateWarning: string | undefined;

    if (fullySyncedIds.length > 0) {
      const { data: syncedRows, error: syncStatusError } = await supabaseAdmin
        .from('game_data_actions')
        .update({ status: 'synced', pr_url: prData.html_url })
        .in('id', fullySyncedIds)
        .eq('status', 'approved')
        .select('id');

      if (syncStatusError) {
        console.error('Failed to update action statuses to synced:', syncStatusError);
        statusUpdateWarning = 'PR created, but failed to update action status to synced';
      } else {
        syncedActionIds = (syncedRows ?? []).map((row) => row.id);
        if (syncedActionIds.length < fullySyncedIds.length) {
          statusUpdateWarning =
            'PR created, but some actions were not updated to synced (status changed concurrently)';
        }
      }
    }

    const syncedActionIdSet = new Set(syncedActionIds);
    const unsyncedActionIds = approvedActionIds.filter(
      (actionId) => !syncedActionIdSet.has(actionId)
    );

    return NextResponse.json({
      success: true,
      prUrl: prData.html_url,
      prNumber: prData.number,
      branch: newBranch,
      commits: commitResults,
      failedActions,
      syncedActionIds,
      unsyncedActionIds,
      statusUpdateWarning,
    });
  } catch (err) {
    console.error('Sync PR API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
