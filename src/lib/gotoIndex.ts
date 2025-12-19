import { CATEGORY_HINTS, type CategoryHint, type GotoResult } from '@/lib/types';
import type { ItemGroupDefinition } from '@/data/types';
import { getDocPages } from '@/features/articles/utils/docs';
import { getItemGroupImageUrl } from '@/features/items/components/itemGroups/itemGroup-grid/getItemGroupImageUrl';
import {
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  itemGroups,
  items,
  maps,
  specialSkills,
  type Skill,
} from '@/data';

type Kind =
  | 'character'
  | 'itemGroup'
  | 'card'
  | 'entity-cat'
  | 'entity-mouse'
  | 'item'
  | 'buff'
  | 'special-skill-cat'
  | 'special-skill-mouse'
  | 'doc'
  | 'character-skill'
  | 'map'
  | 'fixture';

export type IndexEntry = {
  kind: Kind;
  priority: number;
  goto: GotoResult; // base result; skills don't include level fields yet
  // Skill enrichment metadata
  skillMeta?: {
    type: Skill['type'];
    levels: Skill['skillLevels'];
    ownerId?: string;
    ownerFactionId?: string;
  };
};

export type GotoIndex = {
  byName: Map<string, IndexEntry[]>;
};

// Normalizes input names for indexing and lookups.
// Does NOT lowercase to preserve CJK casing semantics.
export function normalizeName(input: string): string {
  let s = input.trim();
  // Normalize unicode spaces and collapse internal whitespace
  s = s.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
  s = s.replace(/\s+/g, ' ');
  // Convert full-width digits and some punctuation to half-width
  s = s.replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
  s = s.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff01 + 0x21));
  return s;
}

export function normalizeCategoryHint(raw?: string): CategoryHint | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  return (CATEGORY_HINTS as readonly string[]).includes(v) ? (v as CategoryHint) : undefined;
}

const PRIORITY: Record<Kind, { name: number; alias: number }> = {
  character: { name: 1, alias: 13 },
  itemGroup: { name: 2, alias: 14 },
  card: { name: 3, alias: 99 }, // no alias search for cards in current behavior
  'entity-cat': { name: 4, alias: 15 },
  'entity-mouse': { name: 5, alias: 16 },
  item: { name: 6, alias: 17 },
  buff: { name: 7, alias: 98 }, // alias handled via fuzzy later, not here
  'special-skill-cat': { name: 8, alias: 18 },
  'special-skill-mouse': { name: 9, alias: 19 },
  map: { name: 10, alias: 24 },
  fixture: { name: 11, alias: 25 },
  doc: { name: 12, alias: 12 },
  'character-skill': { name: 20, alias: 20 }, // skills resolved after alias matches
};

function push(map: Map<string, IndexEntry[]>, key: string, entry: IndexEntry) {
  const list = map.get(key);
  if (list) list.push(entry);
  else map.set(key, [entry]);
}

let indexPromise: Promise<GotoIndex> | null = null;

export async function ensureGotoIndex(): Promise<GotoIndex> {
  if (indexPromise) return indexPromise;
  indexPromise = buildGotoIndex();
  return indexPromise;
}

async function buildGotoIndex(): Promise<GotoIndex> {
  const byName = new Map<string, IndexEntry[]>();

  // Characters
  for (const [id, c] of Object.entries(characters)) {
    const base: GotoResult = {
      url: `/characters/${encodeURIComponent(id)}`,
      type: 'character',
      name: c.id,
      description: c.description,
      imageUrl: c.imageUrl,
      ...(c.factionId ? { factionId: c.factionId } : {}),
    };
    push(byName, normalizeName(id), {
      kind: 'character',
      priority: PRIORITY.character.name,
      goto: base,
    });
    for (const alias of c.aliases ?? []) {
      push(byName, normalizeName(alias), {
        kind: 'character',
        priority: PRIORITY.character.alias,
        goto: base,
      });
    }
    // Character skills
    for (const s of c.skills as Skill[]) {
      const skillBaseUrl = `/characters/${encodeURIComponent(id)}#Skill:${encodeURIComponent(s.name)}`;
      const skillGoto: GotoResult = {
        url: skillBaseUrl,
        type: 'character-skill',
        name: s.name,
        description: s.description,
        imageUrl: s.imageUrl,
        ownerName: c.id,
        ...(c.factionId ? { ownerFactionId: c.factionId } : {}),
      };
      const entryBase: IndexEntry = {
        kind: 'character-skill',
        priority: PRIORITY['character-skill'].name,
        goto: skillGoto,
        skillMeta: {
          type: s.type,
          levels: s.skillLevels,
          ownerId: id,
          ...(c.factionId ? { ownerFactionId: c.factionId } : {}),
        },
      };
      push(byName, normalizeName(s.name), entryBase);
      for (const a of s.aliases ?? []) {
        push(byName, normalizeName(a), {
          ...entryBase,
          priority: PRIORITY['character-skill'].alias,
        });
      }
    }
  }

  // Item Groups
  for (const [name, g] of Object.entries(itemGroups)) {
    const goto: GotoResult = {
      url: `/itemGroups/${encodeURIComponent(name)}`,
      type: 'itemGroup',
      name: g.name || '',
      description: g.description,
      imageUrl: getItemGroupImageUrl((g as ItemGroupDefinition) || { group: [] }),
    };
    push(byName, normalizeName(name), {
      kind: 'itemGroup',
      priority: PRIORITY.itemGroup.name,
      goto,
    });
    for (const a of g.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'itemGroup',
        priority: PRIORITY.itemGroup.alias,
        goto,
      });
    }
  }

  // Cards (no alias index to preserve behavior)
  for (const [id, card] of Object.entries(cards)) {
    const goto: GotoResult = {
      url: `/cards/${encodeURIComponent(id)}`,
      type: 'card',
      name: card.id,
      description: card.description,
      imageUrl: card.imageUrl,
    };
    push(byName, normalizeName(id), {
      kind: 'card',
      priority: PRIORITY.card.name,
      goto,
    });
  }

  // Entities (cat/mouse)
  for (const [name, e] of Object.entries(entities['cat'])) {
    const goto: GotoResult = {
      url: `/entities/${encodeURIComponent(name)}`,
      type: 'entity',
      name: e.name,
      description: e.description,
      imageUrl: e.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'entity-cat',
      priority: PRIORITY['entity-cat'].name,
      goto,
    });
    for (const a of e.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'entity-cat',
        priority: PRIORITY['entity-cat'].alias,
        goto,
      });
    }
  }
  for (const [name, e] of Object.entries(entities['mouse'])) {
    const goto: GotoResult = {
      url: `/entities/${encodeURIComponent(name)}`,
      type: 'entity',
      name: e.name,
      description: e.description,
      imageUrl: e.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'entity-mouse',
      priority: PRIORITY['entity-mouse'].name,
      goto,
    });
    for (const a of e.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'entity-mouse',
        priority: PRIORITY['entity-mouse'].alias,
        goto,
      });
    }
  }

  // Items
  for (const [name, it] of Object.entries(items)) {
    const goto: GotoResult = {
      url: `/items/${encodeURIComponent(name)}`,
      type: 'item',
      name: it.name,
      description: it.description,
      imageUrl: it.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'item',
      priority: PRIORITY.item.name,
      goto,
    });
    for (const a of it.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'item',
        priority: PRIORITY.item.alias,
        goto,
      });
    }
  }

  // Buffs (no alias in index; fuzzy handled later)
  for (const name of Object.keys(buffs)) {
    const b = buffs[name as keyof typeof buffs]!;
    const goto: GotoResult = {
      url: `/buffs/${encodeURIComponent(name)}`,
      type: 'buff',
      name: b.name,
      description: b.description,
      imageUrl: b.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'buff',
      priority: PRIORITY.buff.name,
      goto,
    });
  }

  // Special Skills
  for (const [name, s] of Object.entries(specialSkills['cat'])) {
    const goto: GotoResult = {
      url: `/special-skills/cat/${encodeURIComponent(name)}`,
      type: 'special-skill-cat',
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'special-skill-cat',
      priority: PRIORITY['special-skill-cat'].name,
      goto,
    });
    for (const a of s.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'special-skill-cat',
        priority: PRIORITY['special-skill-cat'].alias,
        goto,
      });
    }
  }
  for (const [name, s] of Object.entries(specialSkills['mouse'])) {
    const goto: GotoResult = {
      url: `/special-skills/mouse/${encodeURIComponent(name)}`,
      type: 'special-skill-mouse',
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'special-skill-mouse',
      priority: PRIORITY['special-skill-mouse'].name,
      goto,
    });
    for (const a of s.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'special-skill-mouse',
        priority: PRIORITY['special-skill-mouse'].alias,
        goto,
      });
    }
  }

  // Maps
  for (const [name, it] of Object.entries(maps)) {
    const goto: GotoResult = {
      url: `/maps/${encodeURIComponent(name)}`,
      type: 'map',
      name: it.name,
      description: it.description,
      imageUrl: it.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'map',
      priority: PRIORITY.map.name,
      goto,
    });
    for (const a of it.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'map',
        priority: PRIORITY.map.alias,
        goto,
      });
    }
  }

  // Fixtures
  for (const [name, it] of Object.entries(fixtures)) {
    const goto: GotoResult = {
      url: `/fixtures/${encodeURIComponent(name)}`,
      type: 'fixture',
      name: it.name,
      description: it.description,
      imageUrl: it.imageUrl,
    };
    push(byName, normalizeName(name), {
      kind: 'fixture',
      priority: PRIORITY.fixture.name,
      goto,
    });
    for (const a of it.aliases ?? []) {
      push(byName, normalizeName(a), {
        kind: 'fixture',
        priority: PRIORITY.fixture.alias,
        goto,
      });
    }
  }

  // Docs
  const docPages = await getDocPages();
  for (const page of docPages) {
    const slugKey = normalizeName(page.slug);
    const titleKey = normalizeName(page.title);
    const goto: GotoResult = {
      url: `/docs/${encodeURIComponent(page.slug)}`,
      type: 'doc',
      name: page.title,
      description: '',
      imageUrl: undefined,
    };
    push(byName, slugKey, {
      kind: 'doc',
      priority: PRIORITY.doc.name,
      goto,
    });
    if (titleKey !== slugKey) {
      push(byName, titleKey, {
        kind: 'doc',
        priority: PRIORITY.doc.name,
        goto,
      });
    }
  }

  // Sort lists by priority to keep selection deterministic
  byName.forEach((list) => {
    (list as IndexEntry[]).sort((a: IndexEntry, b: IndexEntry) => a.priority - b.priority);
  });

  return { byName };
}
