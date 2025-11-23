import {
  buffs,
  cards,
  characters,
  entities,
  itemGroups,
  items,
  specialSkills,
  type Skill,
} from '@/data';
import type { ItemGroupDefinition } from '@/data/types';

import { getDocPages } from '@/lib/docUtils';
import { CATEGORY_HINTS, type CategoryHint, type GotoResult } from '@/lib/types';
import { getItemGroupImageUrl } from '@/components/displays/itemGroups/itemGroup-grid/getItemGroupImageUrl';

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
  | 'character-skill';

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
  character: { name: 1, alias: 11 },
  itemGroup: { name: 2, alias: 12 },
  card: { name: 3, alias: 99 }, // no alias search for cards in current behavior
  'entity-cat': { name: 4, alias: 13 },
  'entity-mouse': { name: 5, alias: 14 },
  item: { name: 6, alias: 15 },
  buff: { name: 7, alias: 98 }, // alias handled via fuzzy later, not here
  'special-skill-cat': { name: 8, alias: 16 },
  'special-skill-mouse': { name: 9, alias: 17 },
  doc: { name: 10, alias: 10 },
  'character-skill': { name: 18, alias: 18 }, // skills resolved after alias matches
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
