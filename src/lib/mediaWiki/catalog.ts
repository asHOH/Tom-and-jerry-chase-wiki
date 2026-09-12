import 'server-only';

import { createHash } from 'node:crypto';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import type {
  PublishedGameDataByType,
  PublishedGameDataSnapshot,
} from '@/lib/gameData/published/types';
import type { GotoResult } from '@/lib/types';
import { SITE_NAME, SITE_URL } from '@/constants/seo';
import type { FactionId } from '@/data/types';

import {
  ensureGotoIndex,
  normalizeName,
  type GotoIndexEntry,
  type GotoIndexKind,
} from '../gotoIndex';

const HOME_DESCRIPTION = '非官方玩家资料站，查询猫和老鼠手游的角色、道具、知识卡等信息。';

/** A section exposed by the compatibility layer's `action=parse` response. */
export type MediaWikiSection = Readonly<{
  index: string;
  level: number;
  line: string;
  anchor: string;
}>;

export type MediaWikiPageKind = GotoResult['type'] | 'main' | 'disambiguation';

/** A candidate listed by a synthetic disambiguation page. */
export type MediaWikiDisambiguationCandidate = Readonly<{
  pageid: number;
  title: string;
  qualifiedTitle: string;
  kind: GotoResult['type'];
  categoryLabel: string;
  kindDescription: string;
  route: string;
  fullUrl: string;
  description: string;
  imageUrl?: string;
}>;

/**
 * One virtual namespace-0 page. `route` is the path (and, for a character
 * skill, fragment) used by the public site. The two absolute URL fields are
 * kept separate in the public shape because MediaWiki returns both fields.
 */
export type MediaWikiPage = Readonly<{
  pageid: number;
  kind: MediaWikiPageKind;
  title: string;
  route: string;
  fullUrl: string;
  canonicalUrl: string;
  description: string;
  extract: string;
  aliases: readonly string[];
  sections: readonly MediaWikiSection[];
  categoryLabel: string;
  kindDescription: string;
  imageUrl?: string;
  factionId?: FactionId;
  ownerName?: string;
  ownerFactionId?: FactionId;
  candidates?: readonly MediaWikiDisambiguationCandidate[];
}>;

/** Options accepted by the catalog search helper. */
export type MediaWikiSearchOptions = Readonly<{
  what?: 'text' | 'title' | 'nearmatch';
  limit?: number;
  namespace?: 0 | '*';
}>;

/** One MediaWiki-style search result, with the page object retained for routes. */
export type MediaWikiSearchResult = Readonly<{
  page: MediaWikiPage;
  pageid: number;
  title: string;
  snippet: string;
  wordcount: number;
  score: number;
}>;

/**
 * Immutable-in-use catalog indexes. `pages` includes synthetic
 * disambiguation pages; `articlePages` is the namespace-0 corpus used for
 * search and random-page selection and excludes those synthetic pages.
 */
export type MediaWikiCatalog = Readonly<{
  pages: readonly MediaWikiPage[];
  articlePages: readonly MediaWikiPage[];
  pagesById: ReadonlyMap<number, MediaWikiPage>;
  pagesByRoute: ReadonlyMap<string, MediaWikiPage>;
  /** Effective title lookup. Ambiguous names resolve to a disambiguation page. */
  pagesByTitle: ReadonlyMap<string, MediaWikiPage>;
  /** Canonical and alias lookup candidates, before ambiguity is projected. */
  pagesByName: ReadonlyMap<string, readonly MediaWikiPage[]>;
}>;

type SourcePage = Readonly<{
  identity: string;
  entry: GotoIndexEntry;
  names: ReadonlySet<string>;
  priority: number;
}>;

type MutableSourcePage = {
  identity: string;
  entry: GotoIndexEntry;
  names: Set<string>;
  priority: number;
};

const catalogCache = new WeakMap<object, Promise<MediaWikiCatalog>>();

function identityFor(entry: GotoIndexEntry): string {
  return `${entry.kind}\0${entry.goto.url}`;
}

function toPlainText(value: string | undefined): string {
  if (!value) return '';

  // Game-data descriptions use a small wiki-like notation. Preserve labels
  // while removing its visual-only wrappers before exposing an extract.
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\{([^{}]+)\}/g, '$1')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

/** Convert a user-provided image reference into an absolute HTTP(S) URL. */
export function normalizeMediaWikiImageUrl(imageUrl: string | undefined): string | undefined {
  const candidate = imageUrl?.trim();
  if (!candidate) return undefined;

  try {
    const parsed = new URL(candidate, SITE_URL);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function absoluteSiteUrl(route: string): string {
  return new URL(route, SITE_URL).toString();
}

function createStablePageId(kind: MediaWikiPageKind, route: string): number {
  const digest = createHash('sha256')
    .update(`${kind}\0${route}`, 'utf8')
    .digest('hex')
    .slice(0, 13);
  const pageid = Number.parseInt(digest, 16);

  // Thirteen hexadecimal digits fit below Number.MAX_SAFE_INTEGER. A zero
  // hash is extraordinarily unlikely, but rejecting it preserves the
  // positive-ID invariant instead of silently changing the hash algorithm.
  if (!Number.isSafeInteger(pageid) || pageid <= 0) {
    throw new Error(`Unable to create a positive stable MediaWiki page ID for ${kind} ${route}`);
  }
  return pageid;
}

function categoryFor(
  kind: GotoIndexKind,
  factionId?: FactionId
): {
  categoryLabel: string;
  kindDescription: string;
} {
  const faction = factionId === 'cat' ? '猫' : factionId === 'mouse' ? '鼠' : undefined;

  if (kind === 'character')
    return { categoryLabel: faction ? `${faction}角色` : '角色', kindDescription: '角色' };
  if (kind === 'card')
    return { categoryLabel: faction ? `${faction}知识卡` : '知识卡', kindDescription: '知识卡' };
  if (kind === 'item') return { categoryLabel: '道具', kindDescription: '道具' };
  if (kind === 'itemGroup') return { categoryLabel: '组合', kindDescription: '组合' };
  if (kind === 'buff') return { categoryLabel: '状态', kindDescription: '状态' };
  if (kind === 'special-skill-cat') return { categoryLabel: '猫特技', kindDescription: '猫方特技' };
  if (kind === 'special-skill-mouse')
    return { categoryLabel: '鼠特技', kindDescription: '鼠方特技' };
  if (kind === 'character-skill') return { categoryLabel: '技能', kindDescription: '角色技能' };
  if (kind === 'entity') return { categoryLabel: '衍生物', kindDescription: '衍生物' };
  if (kind === 'map') return { categoryLabel: '地图', kindDescription: '地图' };
  if (kind === 'fixture') return { categoryLabel: '地图组件', kindDescription: '地图组件/场景物' };
  if (kind === 'mode') return { categoryLabel: '游戏模式', kindDescription: '游戏模式' };
  if (kind === 'achievement') return { categoryLabel: '对局成就', kindDescription: '对局成就' };
  return { categoryLabel: '文档', kindDescription: '文档' };
}

function collectSourcePages(index: { byName: Map<string, GotoIndexEntry[]> }): SourcePage[] {
  const byIdentity = new Map<string, MutableSourcePage>();

  for (const [name, entries] of index.byName) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) continue;

    for (const entry of entries) {
      const identity = identityFor(entry);
      const existing = byIdentity.get(identity);
      if (existing) {
        existing.names.add(normalizedName);
        existing.priority = Math.min(existing.priority, entry.priority);
      } else {
        byIdentity.set(identity, {
          identity,
          entry,
          names: new Set([normalizedName]),
          priority: entry.priority,
        });
      }
    }
  }

  return [...byIdentity.values()]
    .map((source) => ({
      identity: source.identity,
      entry: source.entry,
      names: source.names,
      priority: source.priority,
    }))
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        a.entry.goto.name.localeCompare(b.entry.goto.name, 'zh-CN') ||
        a.entry.goto.url.localeCompare(b.entry.goto.url)
    );
}

function addNameCandidate(
  byName: Map<string, SourcePage[]>,
  name: string,
  source: SourcePage
): void {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return;

  const candidates = byName.get(normalizedName);
  if (candidates) {
    if (!candidates.some((candidate) => candidate.identity === source.identity)) {
      candidates.push(source);
    }
  } else {
    byName.set(normalizedName, [source]);
  }
}

function sourcePageTitle(source: SourcePage): string {
  const title = source.entry.goto.name.trim();
  if (title) return title;
  return [...source.names][0] ?? source.entry.goto.url;
}

function sourcePageSections(
  source: SourcePage,
  gameData: PublishedGameDataByType,
  sectionsByCharacterRoute: ReadonlyMap<string, readonly MediaWikiSection[]>
): readonly MediaWikiSection[] {
  if (source.entry.kind !== 'character') return [];
  const route = source.entry.goto.url;
  const sections = sectionsByCharacterRoute.get(route);
  if (sections) return sections;

  // This fallback keeps the page contract correct when an index entry was
  // produced for a character whose data was removed between index creation
  // and catalog projection.
  const characterId = route.match(/^\/characters\/([^#?]+)/)?.[1];
  if (!characterId) return [];
  let decodedId: string;
  try {
    decodedId = decodeURIComponent(characterId);
  } catch {
    return [];
  }
  const character = gameData.characters[decodedId];
  if (!character) return [];
  return character.skills.map((skill, index) => ({
    index: String(index + 1),
    level: 2,
    line: skill.name,
    anchor: `Skill:${skill.name}`,
  }));
}

function buildCharacterSections(
  gameData: PublishedGameDataByType
): ReadonlyMap<string, readonly MediaWikiSection[]> {
  const sectionsByRoute = new Map<string, readonly MediaWikiSection[]>();

  for (const [characterId, character] of Object.entries(gameData.characters)) {
    const route = `/characters/${encodeURIComponent(characterId)}`;
    const sections = character.skills.map((skill, index) => ({
      index: String(index + 1),
      level: 2,
      line: skill.name,
      anchor: `Skill:${skill.name}`,
    }));
    sectionsByRoute.set(route, Object.freeze(sections));
  }

  return sectionsByRoute;
}

function pageFromSource(
  source: SourcePage,
  gameData: PublishedGameDataByType,
  sectionsByCharacterRoute: ReadonlyMap<string, readonly MediaWikiSection[]>
): MediaWikiPage {
  const { goto } = source.entry;
  const title = sourcePageTitle(source);
  const description = toPlainText(goto.description);
  const imageUrl = normalizeMediaWikiImageUrl(goto.imageUrl);
  const category = categoryFor(source.entry.kind, goto.factionId);
  const fields = {
    pageid: createStablePageId(source.entry.kind, goto.url),
    kind: source.entry.kind,
    title,
    route: goto.url,
    fullUrl: absoluteSiteUrl(goto.url),
    canonicalUrl: absoluteSiteUrl(goto.url),
    description,
    extract: description,
    aliases: Object.freeze(
      [...source.names]
        .filter((name) => normalizeName(name) !== normalizeName(title))
        .sort((a, b) => a.localeCompare(b, 'zh-CN'))
    ),
    sections: sourcePageSections(source, gameData, sectionsByCharacterRoute),
    categoryLabel: category.categoryLabel,
    kindDescription: category.kindDescription,
    ...(imageUrl ? { imageUrl } : {}),
    ...(goto.factionId ? { factionId: goto.factionId } : {}),
    ...(goto.ownerName ? { ownerName: goto.ownerName } : {}),
    ...(goto.ownerFactionId ? { ownerFactionId: goto.ownerFactionId } : {}),
  } satisfies MediaWikiPage;

  return Object.freeze(fields);
}

function makeMainPage(): MediaWikiPage {
  const route = '/';
  return Object.freeze({
    pageid: createStablePageId('main', route),
    kind: 'main',
    title: SITE_NAME,
    route,
    fullUrl: absoluteSiteUrl(route),
    canonicalUrl: absoluteSiteUrl(route),
    description: HOME_DESCRIPTION,
    extract: HOME_DESCRIPTION,
    aliases: Object.freeze(['Main Page', '首页']),
    sections: Object.freeze([]),
    categoryLabel: '首页',
    kindDescription: '首页',
    imageUrl: normalizeMediaWikiImageUrl('/icon.png')!,
  });
}

function makeDisambiguationPage(name: string, candidates: readonly MediaWikiPage[]): MediaWikiPage {
  const route = `/goto/${encodeURIComponent(name)}`;
  const disambiguationCandidates = Object.freeze(
    candidates.map((candidate) => ({
      pageid: candidate.pageid,
      title: candidate.title,
      qualifiedTitle: `${candidate.title}（${candidate.categoryLabel}）`,
      kind: candidate.kind as GotoResult['type'],
      categoryLabel: candidate.categoryLabel,
      kindDescription: candidate.kindDescription,
      route: candidate.route,
      fullUrl: candidate.fullUrl,
      description: candidate.description,
      ...(candidate.imageUrl ? { imageUrl: candidate.imageUrl } : {}),
    }))
  );
  const description = `${name}可能指：\n${disambiguationCandidates
    .map((candidate) => `- ${candidate.qualifiedTitle}，${candidate.kindDescription}`)
    .join('\n')}`;
  const firstImage = disambiguationCandidates[0]?.imageUrl;

  return Object.freeze({
    pageid: createStablePageId('disambiguation', route),
    kind: 'disambiguation',
    title: name,
    route,
    fullUrl: absoluteSiteUrl(route),
    canonicalUrl: absoluteSiteUrl(route),
    description,
    extract: description,
    aliases: Object.freeze([]),
    sections: Object.freeze([]),
    categoryLabel: '消歧页',
    kindDescription: '消歧页',
    ...(firstImage ? { imageUrl: firstImage } : {}),
    candidates: disambiguationCandidates,
  });
}

function assertUniquePageIds(pages: readonly MediaWikiPage[]): void {
  const byId = new Map<number, MediaWikiPage>();
  for (const page of pages) {
    const existing = byId.get(page.pageid);
    if (existing && (existing.kind !== page.kind || existing.route !== page.route)) {
      throw new Error(
        `MediaWiki page ID collision: ${page.pageid} for ${existing.kind} ${existing.route} and ${page.kind} ${page.route}`
      );
    }
    byId.set(page.pageid, page);
  }
}

function comparePages(a: MediaWikiPage, b: MediaWikiPage): number {
  return a.pageid - b.pageid || a.route.localeCompare(b.route);
}

function clampSearchLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) return 10;
  return Math.min(10, Math.max(1, Math.trunc(limit ?? 10)));
}

function searchFieldMatches(
  page: MediaWikiPage,
  query: string,
  what: NonNullable<MediaWikiSearchOptions['what']>
): { rank: number; matchedNames: readonly string[] } | null {
  const titleFields = [normalizeName(page.title), ...page.aliases.map(normalizeName)].filter(
    Boolean
  );
  const queryKey = query.toLocaleLowerCase('zh-CN');
  const exactNames = titleFields.filter((field) => field.toLocaleLowerCase('zh-CN') === queryKey);
  if (exactNames.length > 0) return { rank: 0, matchedNames: exactNames };

  const prefixNames = titleFields.filter((field) =>
    field.toLocaleLowerCase('zh-CN').startsWith(queryKey)
  );
  if (prefixNames.length > 0) return { rank: 1, matchedNames: prefixNames };

  const titleNames = titleFields.filter((field) =>
    field.toLocaleLowerCase('zh-CN').includes(queryKey)
  );
  if (titleNames.length > 0) return { rank: 2, matchedNames: titleNames };

  if (what === 'title') return null;
  if (what === 'nearmatch') return null;

  if (normalizeName(page.description).toLocaleLowerCase('zh-CN').includes(queryKey)) {
    return { rank: 3, matchedNames: [] };
  }
  return null;
}

function snippetFor(page: MediaWikiPage, query: string): string {
  const text = page.extract || page.description;
  if (!text) return '';
  const lowerText = text.toLocaleLowerCase('zh-CN');
  const lowerQuery = query.toLocaleLowerCase('zh-CN');
  const matchAt = lowerText.indexOf(lowerQuery);
  if (matchAt < 0 || text.length <= 200) return text.slice(0, 200);

  const start = Math.max(0, matchAt - 80);
  const end = Math.min(text.length, start + 200);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

/** Search the catalog using the ranking used by the Action API facade. */
export function searchMediaWikiCatalog(
  catalog: MediaWikiCatalog,
  rawQuery: string,
  options: MediaWikiSearchOptions = {}
): readonly MediaWikiSearchResult[] {
  if (options.namespace !== undefined && options.namespace !== 0 && options.namespace !== '*') {
    return [];
  }

  const query = normalizeName(rawQuery);
  if (!query) return [];
  const what = options.what ?? 'text';
  const rows: MediaWikiSearchResult[] = [];

  for (const page of catalog.articlePages) {
    const match = searchFieldMatches(page, query, what);
    if (!match) continue;

    const collidingCandidate = match.matchedNames.some((matchedName) => {
      const candidates = catalog.pagesByName.get(matchedName);
      return (
        !!candidates?.some((candidate) => candidate.pageid === page.pageid) && candidates.length > 1
      );
    });
    const title = collidingCandidate ? `${page.title}（${page.categoryLabel}）` : page.title;
    rows.push({
      page,
      pageid: page.pageid,
      title,
      snippet: snippetFor(page, query),
      wordcount: page.extract.length,
      score: match.rank,
    });
  }

  return Object.freeze(
    rows
      .sort(
        (a, b) =>
          a.score - b.score ||
          a.title.localeCompare(b.title, 'zh-CN') ||
          a.page.route.localeCompare(b.page.route)
      )
      .slice(0, clampSearchLimit(options.limit))
  );
}

/** Resolve an effective title or alias (ambiguous names resolve to a synthetic page). */
export function lookupMediaWikiPage(
  catalog: MediaWikiCatalog,
  title: string
): MediaWikiPage | undefined {
  return catalog.pagesByTitle.get(normalizeName(title));
}

export function getMediaWikiPageById(
  catalog: MediaWikiCatalog,
  pageid: number
): MediaWikiPage | undefined {
  return catalog.pagesById.get(pageid);
}

export function getMediaWikiPageByRoute(
  catalog: MediaWikiCatalog,
  route: string
): MediaWikiPage | undefined {
  return catalog.pagesByRoute.get(route);
}

/** Build a catalog for a published game-data object. */
export async function buildMediaWikiCatalog(
  gameData: PublishedGameDataByType
): Promise<MediaWikiCatalog> {
  const index = await ensureGotoIndex(gameData);
  const sources = collectSourcePages(index);
  const sectionsByCharacterRoute = buildCharacterSections(gameData);

  const sourcePages = sources.map((source) =>
    pageFromSource(source, gameData, sectionsByCharacterRoute)
  );
  const pageByIdentity = new Map<string, MediaWikiPage>();
  for (const [source, page] of sources.map(
    (source, index) => [source, sourcePages[index]!] as const
  )) {
    pageByIdentity.set(source.identity, page);
  }

  const sourceCandidatesByName = new Map<string, SourcePage[]>();
  for (const source of sources) {
    addNameCandidate(sourceCandidatesByName, sourcePageTitle(source), source);
    for (const name of source.names) addNameCandidate(sourceCandidatesByName, name, source);
  }

  const canonicalNameCandidates = new Map<string, readonly MediaWikiPage[]>();
  for (const [name, candidates] of sourceCandidatesByName) {
    const pages = candidates
      .map((candidate) => pageByIdentity.get(candidate.identity))
      .filter((page): page is MediaWikiPage => page !== undefined)
      .sort(comparePages);
    canonicalNameCandidates.set(name, Object.freeze(pages));
  }

  const mainPage = makeMainPage();
  const canonicalPages = Object.freeze([mainPage, ...sourcePages].sort(comparePages));
  const disambiguationPages: MediaWikiPage[] = [];
  const disambiguationByTitle = new Map<string, MediaWikiPage>();
  const effectiveTitlePages = new Map<string, MediaWikiPage>();
  const pagesByName = new Map<string, readonly MediaWikiPage[]>();

  effectiveTitlePages.set(normalizeName(mainPage.title), mainPage);
  effectiveTitlePages.set('main page', mainPage);
  effectiveTitlePages.set('首页', mainPage);
  pagesByName.set(normalizeName(mainPage.title), Object.freeze([mainPage]));
  pagesByName.set('main page', Object.freeze([mainPage]));
  pagesByName.set('首页', Object.freeze([mainPage]));

  for (const [name, pages] of canonicalNameCandidates) {
    if (pages.length === 0) continue;
    pagesByName.set(name, pages);
    if (pages.length === 1) {
      effectiveTitlePages.set(name, pages[0]!);
      continue;
    }

    const disambiguationPage = makeDisambiguationPage(name, pages);
    disambiguationPages.push(disambiguationPage);
    disambiguationByTitle.set(name, disambiguationPage);
    effectiveTitlePages.set(name, disambiguationPage);
  }

  // Keep canonical title lookup available even when an entry's display title
  // was not itself present in the goto index (for example a display alias).
  for (const page of sourcePages) {
    const titleKey = normalizeName(page.title);
    if (!titleKey || effectiveTitlePages.has(titleKey)) continue;
    effectiveTitlePages.set(titleKey, page);
    pagesByName.set(titleKey, Object.freeze([page]));
  }

  // Search presents colliding results with a category-qualified title such
  // as "名称（知识卡）". Make that exact presentation resolvable as a title
  // too, so a caller can feed a search result back into `titles=`. A
  // qualified title can itself collide (for example, two same-category
  // records with the same display name); project that case to a deterministic
  // synthetic disambiguation page rather than selecting by insertion order.
  const qualifiedCandidatesByName = new Map<string, MediaWikiPage[]>();
  for (const page of sourcePages) {
    const qualifiedName = normalizeName(`${page.title}（${page.categoryLabel}）`);
    if (!qualifiedName) continue;
    const candidates = qualifiedCandidatesByName.get(qualifiedName);
    if (candidates) {
      if (!candidates.some((candidate) => candidate.pageid === page.pageid)) {
        candidates.push(page);
      }
    } else {
      qualifiedCandidatesByName.set(qualifiedName, [page]);
    }
  }

  for (const [qualifiedName, qualifiedCandidates] of qualifiedCandidatesByName) {
    const existingCandidates = pagesByName.get(qualifiedName) ?? [];
    const mergedCandidates = [...existingCandidates, ...qualifiedCandidates]
      .filter(
        (page, index, pages) =>
          pages.findIndex((candidate) => candidate.pageid === page.pageid) === index
      )
      .sort(comparePages);
    if (mergedCandidates.length === 0) continue;

    const frozenCandidates = Object.freeze(mergedCandidates);
    pagesByName.set(qualifiedName, frozenCandidates);
    if (mergedCandidates.length === 1) {
      effectiveTitlePages.set(qualifiedName, mergedCandidates[0]!);
      continue;
    }

    const existingDisambiguation = disambiguationByTitle.get(qualifiedName);
    const existingCandidateIds = existingDisambiguation?.candidates?.map(
      (candidate) => candidate.pageid
    );
    const candidateIds = mergedCandidates.map((candidate) => candidate.pageid);
    const canReuseExisting =
      existingDisambiguation &&
      existingCandidateIds?.length === candidateIds.length &&
      existingCandidateIds.every((pageid, index) => pageid === candidateIds[index]);
    const disambiguationPage = canReuseExisting
      ? existingDisambiguation
      : makeDisambiguationPage(qualifiedName, frozenCandidates);
    if (!canReuseExisting) {
      const previousIndex = disambiguationPages.findIndex(
        (page) => page.route === disambiguationPage.route
      );
      if (previousIndex >= 0) disambiguationPages[previousIndex] = disambiguationPage;
      else disambiguationPages.push(disambiguationPage);
      disambiguationByTitle.set(qualifiedName, disambiguationPage);
    }
    effectiveTitlePages.set(qualifiedName, disambiguationPage);
  }

  const allPages = Object.freeze([...canonicalPages, ...disambiguationPages].sort(comparePages));
  assertUniquePageIds(allPages);

  const pagesById = new Map<number, MediaWikiPage>();
  const pagesByRoute = new Map<string, MediaWikiPage>();
  for (const page of allPages) {
    pagesById.set(page.pageid, page);
    pagesByRoute.set(page.route, page);
  }

  return Object.freeze({
    pages: allPages,
    articlePages: canonicalPages,
    pagesById,
    pagesByRoute,
    pagesByTitle: effectiveTitlePages,
    pagesByName,
  });
}

/** Build/cache a catalog for the currently published snapshot. */
export async function getMediaWikiCatalog(
  snapshot?: PublishedGameDataSnapshot
): Promise<MediaWikiCatalog> {
  const acquiredSnapshot = snapshot ?? (await getPublishedGameDataSnapshot());
  const cacheKey = acquiredSnapshot.data as object;
  const existing = catalogCache.get(cacheKey);
  if (existing) return existing;

  const pending = buildMediaWikiCatalog(acquiredSnapshot.data);
  catalogCache.set(cacheKey, pending);
  return pending;
}
