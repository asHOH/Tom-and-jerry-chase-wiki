import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/requireRole';
import type { Action } from '@/lib/edit/diffUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PROJECT_INFO } from '@/constants';
import { env } from '@/env';

/**
 * Maps entity_type to the source data file path(s) in the repository.
 * Paths are relative to the repository root.
 */
const ENTITY_FILE_MAP: Record<string, string[]> = {
  characters: [
    'src/features/characters/data/catCharacters.ts',
    'src/features/characters/data/mouseCharacters.ts',
  ],
  cards: [
    'src/features/knowledge-cards/data/catKnowledgeCards.ts',
    'src/features/knowledge-cards/data/mouseKnowledgeCards.ts',
  ],
  entities: ['src/data/catEntities.ts', 'src/data/mouseEntities.ts'],
  buffs: ['src/features/buffs/data/buffs.ts'],
  items: ['src/features/items/data/items.ts'],
  fixtures: ['src/features/fixtures/data/fixtures.ts'],
  maps: ['src/data/maps.ts'],
  modes: ['src/features/modes/data/modes.ts'],
  specialSkills: [
    'src/features/special-skills/data/catSpecialSkills.ts',
    'src/features/special-skills/data/mouseSpecialSkills.ts',
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

function getDataFilePaths(entityType: string): string[] {
  return ENTITY_FILE_MAP[entityType] ?? [];
}

const SPECIAL_SKILL_FILE_BY_FACTION = {
  cat: 'catSpecialSkills.ts',
  mouse: 'mouseSpecialSkills.ts',
} as const;

function resolveActionPathForFile(
  entityType: string,
  actionPath: string,
  filePath: string
): string {
  if (entityType !== 'specialSkills') return actionPath;
  if (!actionPath) return actionPath;

  const parts = actionPath.split('.').filter(Boolean);
  if (parts.length < 2) return actionPath;

  const [faction, ...rest] = parts;
  if (faction === 'cat' && filePath.endsWith(SPECIAL_SKILL_FILE_BY_FACTION.cat)) {
    return rest.join('.');
  }
  if (faction === 'mouse' && filePath.endsWith(SPECIAL_SKILL_FILE_BY_FACTION.mouse)) {
    return rest.join('.');
  }

  return actionPath;
}

/**
 * Apply a single Action to a TS source file's content string.
 * Uses heuristic text replacement for simple value changes.
 * Returns the modified content, or null if the path couldn't be located.
 */
function applyActionToFileContent(content: string, action: Action): string | null {
  const pathParts = action.path.split('.').filter(Boolean);
  if (pathParts.length === 0) return null;

  // For set/add ops: find the property in the TS source and update its value
  // For delete: find the property and remove it
  // This uses a heuristic regex approach for common TS data object patterns

  if (action.op === 'delete') {
    return applyDeleteToContent(content, pathParts);
  }

  // set or add
  return applySetToContent(content, pathParts, action.newValue);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function serializeValue(value: unknown, indent: string = '    '): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') {
    // Use single quotes to match TS style, escape internal single quotes
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    return `'${escaped}'`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => serializeValue(v, indent + '  '));
    return `[${items.join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const lines = entries.map(([k, v]) => `${indent}  ${k}: ${serializeValue(v, indent + '  ')}`);
    return `{\n${lines.join(',\n')}\n${indent}}`;
  }
  return String(value);
}

function applySetToContent(content: string, pathParts: string[], newValue: unknown): string | null {
  // Build a regex to find the deepest key and its value
  // Strategy: locate the key in the nesting context
  const lastKey = pathParts[pathParts.length - 1]!;
  const serialized = serializeValue(newValue);

  // Try to find a pattern like: `lastKey: <value>` or `'lastKey': <value>`
  // We need context from parent keys to avoid false matches
  let searchRegion = content;
  let regionOffset = 0;

  // Navigate through parent keys to narrow the search region
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i]!;
    // Match key as either bare identifier or quoted string
    const keyPattern = new RegExp(
      `(?:^|[{,\\n])\\s*(?:${escapeRegex(key)}|'${escapeRegex(key)}'|"${escapeRegex(key)}")\\s*:`,
      'm'
    );
    const match = keyPattern.exec(searchRegion);
    if (!match) return null;

    // Move past the key to find its value block
    const afterKey = match.index! + match[0].length;
    regionOffset += afterKey;
    searchRegion = searchRegion.slice(afterKey);
  }

  // Now find the last key in the narrowed region
  const keyPattern = new RegExp(
    `((?:${escapeRegex(lastKey)}|'${escapeRegex(lastKey)}'|"${escapeRegex(lastKey)}")\\s*:\\s*)([^,}\\n]+(?:(?:\\{[^}]*\\}|\\[[^\\]]*\\])[^,}\\n]*)?)`,
    'm'
  );
  const match = keyPattern.exec(searchRegion);
  if (!match) return null;

  const valueStart = regionOffset + match.index! + match[1]!.length;
  const valueEnd = regionOffset + match.index! + match[0].length;

  return content.slice(0, valueStart) + serialized + content.slice(valueEnd);
}

function applyDeleteToContent(content: string, pathParts: string[]): string | null {
  const lastKey = pathParts[pathParts.length - 1]!;

  let searchRegion = content;
  let regionOffset = 0;

  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i]!;
    const keyPattern = new RegExp(
      `(?:^|[{,\\n])\\s*(?:${escapeRegex(key)}|'${escapeRegex(key)}'|"${escapeRegex(key)}")\\s*:`,
      'm'
    );
    const match = keyPattern.exec(searchRegion);
    if (!match) return null;

    const afterKey = match.index! + match[0].length;
    regionOffset += afterKey;
    searchRegion = searchRegion.slice(afterKey);
  }

  // Find the property line and remove it
  const keyPattern = new RegExp(
    `(\\s*(?:${escapeRegex(lastKey)}|'${escapeRegex(lastKey)}'|"${escapeRegex(lastKey)}")\\s*:[^,}\\n]+,?\\n?)`,
    'm'
  );
  const match = keyPattern.exec(searchRegion);
  if (!match) return null;

  const removeStart = regionOffset + match.index!;
  const removeEnd = regionOffset + match.index! + match[0].length;

  return content.slice(0, removeStart) + content.slice(removeEnd);
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

    // Get the base tree
    const baseCommit = await githubApi<GitHubCommitData>(
      `/repos/${owner}/${repo}/git/commits/${baseSha}`,
      { token }
    );
    let currentTreeSha = baseCommit.tree.sha;

    // Cache fetched file contents to avoid redundant API calls
    const fileContentCache = new Map<string, string>();

    for (const actionRow of actions as ActionRow[]) {
      const flatActions = flattenEntry(actionRow.entry);
      if (flatActions.length === 0) {
        failedActions.push({ actionId: actionRow.id, reason: 'No actions found in entry' });
        continue;
      }

      const filePaths = getDataFilePaths(actionRow.entity_type);
      if (filePaths.length === 0) {
        failedActions.push({
          actionId: actionRow.id,
          reason: `Unknown entity type: ${actionRow.entity_type}`,
        });
        continue;
      }

      // Process each flat action as a separate commit
      for (const action of flatActions) {
        const commitMessage = formatCommitMessage(actionRow.entity_type, action);
        let committed = false;

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
            const modified = applyActionToFileContent(fileContent, actionToApply);
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
            committed = true;
            break;
          } catch (err) {
            // Try next file path
            console.error(`Failed to apply action to ${filePath}:`, err);
            continue;
          }
        }

        if (!committed) {
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

    return NextResponse.json({
      success: true,
      prUrl: prData.html_url,
      prNumber: prData.number,
      branch: newBranch,
      commits: commitResults,
      failedActions,
    });
  } catch (err) {
    console.error('Sync PR API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
