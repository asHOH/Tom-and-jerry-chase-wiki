import { squashActions } from './actionSquash';
import type { Action, ActionHistoryEntry } from './diffUtils';

const setAction = (path: string, oldValue: unknown, newValue: unknown): Action => ({
  op: 'set',
  path,
  oldValue,
  newValue,
});

const deleteAction = (path: string, oldValue: unknown): Action => ({
  op: 'delete',
  path,
  oldValue,
  newValue: undefined,
});

const addAction = (path: string, newValue: unknown): Action => ({
  op: 'add',
  path,
  oldValue: undefined,
  newValue,
});

const marySpecialSkillsOriginal = [
  { name: '魔术漂浮', description: '通用特技。' },
  { name: '干扰投掷', description: '提高干扰能力和技能命中率。' },
];

const marySpecialSkillsFinal = [{ name: '魔术漂浮', description: '通用特技。' }];

describe('squashActions', () => {
  it('should only protect the parent subtree of nested structural edits', () => {
    const deleteSkill = deleteAction('Tom.skills.1', { name: 'old skill' });
    const oldSkillName = setAction('Tom.skills.0.name', 'Skill A', 'Skill B');
    const newSkillName = setAction('Tom.skills.0.name', 'Skill B', 'Skill C');
    const oldDescription = setAction('Tom.description', 'old description', 'middle description');
    const newDescription = setAction('Tom.description', 'middle description', 'new description');

    expect(
      squashActions([deleteSkill, oldSkillName, newSkillName, oldDescription, newDescription])
    ).toEqual([
      deleteSkill,
      oldSkillName,
      newSkillName,
      setAction('Tom.description', 'old description', 'new description'),
    ]);
  });

  it('should squash unrelated repeated sets when another root has structural edits', () => {
    const deleteTomSkill = deleteAction('Tom.skills.1', { name: 'old skill' });
    const oldJerryDescription = setAction('Jerry.description', 'old', 'middle');
    const newJerryDescription = setAction('Jerry.description', 'middle', 'new');

    expect(squashActions([deleteTomSkill, oldJerryDescription, newJerryDescription])).toEqual([
      deleteTomSkill,
      setAction('Jerry.description', 'old', 'new'),
    ]);
  });

  it('should preserve entry grouping for kept actions', () => {
    const structuralBatch: ActionHistoryEntry = [
      deleteAction('Tom.skills.1', { name: 'old skill' }),
      setAction('Tom.skills.0.name', 'Skill A', 'Skill B'),
    ];
    const oldDescription = setAction('Tom.description', 'old description', 'middle description');
    const newDescription = setAction('Tom.description', 'middle description', 'new description');

    expect(squashActions([structuralBatch, oldDescription, newDescription])).toEqual([
      structuralBatch,
      setAction('Tom.description', 'old description', 'new description'),
    ]);
  });

  it('should preserve the original old value when squashing repeated sets', () => {
    const firstPositioningTags = setAction(
      'Tuffy.mousePositioningTags',
      ['cheese'],
      ['cheese', 'rescue']
    );
    const latestPositioningTags = setAction(
      'Tuffy.mousePositioningTags',
      ['cheese', 'rescue'],
      ['cheese', 'rescue.']
    );

    expect(squashActions([firstPositioningTags, latestPositioningTags])).toEqual([
      setAction('Tuffy.mousePositioningTags', ['cheese'], ['cheese', 'rescue.']),
    ]);
  });

  it('should squash clearing and replacing a scalar object property into one set', () => {
    expect(
      squashActions(
        [
          deleteAction('Tom.skills.0.videoUrl', 'https://example.com/old'),
          setAction('Tom.skills.0.videoUrl', undefined, 'https://example.com/new'),
        ],
        {
          currentRoot: {
            Tom: {
              skills: [{ videoUrl: 'https://example.com/new' }],
            },
          },
        }
      )
    ).toEqual([
      setAction('Tom.skills.0.videoUrl', 'https://example.com/old', 'https://example.com/new'),
    ]);
  });

  it('should keep a standalone scalar object-property deletion', () => {
    const deletedVideoUrl = deleteAction('Tom.skills.0.videoUrl', 'https://example.com/old');

    expect(
      squashActions([deletedVideoUrl], {
        currentRoot: {
          Tom: {
            skills: [{}],
          },
        },
      })
    ).toEqual([deletedVideoUrl]);
  });

  it('should preserve the original old value when a scalar property is set and then deleted', () => {
    expect(
      squashActions(
        [
          setAction(
            'Tom.skills.0.videoUrl',
            'https://example.com/old',
            'https://example.com/draft'
          ),
          deleteAction('Tom.skills.0.videoUrl', 'https://example.com/draft'),
        ],
        {
          currentRoot: {
            Tom: {
              skills: [{}],
            },
          },
        }
      )
    ).toEqual([deleteAction('Tom.skills.0.videoUrl', 'https://example.com/old')]);
  });

  it('should drop scalar property delete/set churn that restores the original value', () => {
    expect(
      squashActions(
        [
          deleteAction('Tom.skills.0.videoUrl', 'https://example.com/video'),
          setAction('Tom.skills.0.videoUrl', undefined, 'https://example.com/video'),
        ],
        {
          currentRoot: {
            Tom: {
              skills: [{ videoUrl: 'https://example.com/video' }],
            },
          },
        }
      )
    ).toEqual([]);
  });

  it('should drop scalar object-property add/delete churn', () => {
    expect(
      squashActions(
        [
          addAction('Tom.skills.0.videoUrl', 'https://example.com/video'),
          deleteAction('Tom.skills.0.videoUrl', 'https://example.com/video'),
        ],
        {
          currentRoot: {
            Tom: {
              skills: [{}],
            },
          },
        }
      )
    ).toEqual([]);
  });

  it('should turn scalar object-property delete/add replacement into a set', () => {
    expect(
      squashActions(
        [
          deleteAction('Tom.skills.0.videoUrl', 'https://example.com/old'),
          addAction('Tom.skills.0.videoUrl', 'https://example.com/new'),
        ],
        {
          currentRoot: {
            Tom: {
              skills: [{ videoUrl: 'https://example.com/new' }],
            },
          },
        }
      )
    ).toEqual([
      setAction('Tom.skills.0.videoUrl', 'https://example.com/old', 'https://example.com/new'),
    ]);
  });

  it('should preserve scalar delete/set details when no current root is provided', () => {
    const actions = [
      deleteAction('Tom.skills.0.videoUrl', 'https://example.com/old'),
      setAction('Tom.skills.0.videoUrl', undefined, 'https://example.com/new'),
    ];

    expect(squashActions(actions)).toEqual(actions);
  });

  it('should fold descendant sets into a newly set parent object', () => {
    const newKnowledgeCardGroup = setAction('剑客杰瑞.knowledgeCardGroups.4', undefined, {
      cards: [],
      description: '待补充',
    });
    const updatedDescription = setAction(
      '剑客杰瑞.knowledgeCardGroups.4.description',
      '待补充',
      '打苏蕊，逃窜可换应激反应，不屈可换绝地反击'
    );
    const updatedCards = setAction(
      '剑客杰瑞.knowledgeCardGroups.4.cards',
      [],
      ['S-缴械', 'S-舍己', 'C-不屈', 'C-救救我', 'A-逃窜']
    );

    expect(squashActions([newKnowledgeCardGroup, updatedDescription, updatedCards])).toEqual([
      setAction('剑客杰瑞.knowledgeCardGroups.4', undefined, {
        cards: ['S-缴械', 'S-舍己', 'C-不屈', 'C-救救我', 'A-逃窜'],
        description: '打苏蕊，逃窜可换应激反应，不屈可换绝地反击',
      }),
    ]);
  });

  it('should drop descendant sets that are already represented by a parent array snapshot', () => {
    const addedAliasBatch: ActionHistoryEntry = [
      setAction('真视.aliases', undefined, ['新别名']),
      setAction('真视.aliases.0', undefined, '新别名'),
    ];
    const renamedAlias = setAction('真视.aliases.0', '新别名', '透视');

    expect(squashActions([addedAliasBatch, renamedAlias])).toEqual([
      setAction('真视.aliases', undefined, ['透视']),
    ]);
  });

  it('should collapse special skill delete/add churn to no action when final array equals the derived original', () => {
    expect(
      squashActions(
        [
          deleteAction('玛丽.specialSkills.1', marySpecialSkillsOriginal[1]),
          setAction('玛丽.specialSkills.length', 2, 1),
          setAction('玛丽.specialSkills.1', undefined, marySpecialSkillsOriginal[1]),
        ],
        {
          currentRoot: {
            玛丽: {
              specialSkills: marySpecialSkillsOriginal,
            },
          },
        }
      )
    ).toEqual([]);
  });

  it('should collapse a real special skill deletion to one parent array set', () => {
    expect(
      squashActions(
        [
          deleteAction('玛丽.specialSkills.1', marySpecialSkillsOriginal[1]),
          setAction('玛丽.specialSkills.length', 2, 1),
        ],
        {
          currentRoot: {
            玛丽: {
              specialSkills: marySpecialSkillsFinal,
            },
          },
        }
      )
    ).toEqual([setAction('玛丽.specialSkills', marySpecialSkillsOriginal, marySpecialSkillsFinal)]);
  });

  it('should reconstruct dense oldValue for Valtio delete-index plus length-set array histories', () => {
    const [result] = squashActions(
      [
        deleteAction('玛丽.specialSkills.1', marySpecialSkillsOriginal[1]),
        setAction('玛丽.specialSkills.length', 2, 1),
      ],
      {
        currentRoot: {
          玛丽: {
            specialSkills: marySpecialSkillsFinal,
          },
        },
      }
    );

    expect(result).toEqual(
      setAction('玛丽.specialSkills', marySpecialSkillsOriginal, marySpecialSkillsFinal)
    );

    const oldValue = (result as Action).oldValue;
    expect(Array.isArray(oldValue)).toBe(true);
    expect(Object.keys(oldValue as unknown[])).toEqual(['0', '1']);
  });

  it('should collapse Valtio push-style numeric-index set into one parent array set', () => {
    expect(
      squashActions([setAction('玛丽.specialSkills.1', undefined, marySpecialSkillsOriginal[1])], {
        currentRoot: {
          玛丽: {
            specialSkills: marySpecialSkillsOriginal,
          },
        },
      })
    ).toEqual([setAction('玛丽.specialSkills', marySpecialSkillsFinal, marySpecialSkillsOriginal)]);
  });

  it('should collapse an appended group followed by removing another group to one parent set', () => {
    const originalGroups = ['A', 'B', 'C', 'D', 'E'].map((description) => ({
      cards: [],
      description,
    }));
    const appendedGroup = { cards: [], description: 'new' };
    const groupsAfterAppend = [...originalGroups, appendedGroup];
    const finalGroups = groupsAfterAppend.slice(1);
    const history = [
      setAction('莱特宁.knowledgeCardGroups.5', undefined, appendedGroup),
      setAction('莱特宁.knowledgeCardGroups', groupsAfterAppend, finalGroups),
    ];
    const originalHistory = structuredClone(history);

    expect(
      squashActions(history, {
        currentRoot: {
          莱特宁: {
            knowledgeCardGroups: finalGroups,
          },
        },
      })
    ).toEqual([setAction('莱特宁.knowledgeCardGroups', originalGroups, finalGroups)]);
    expect(history).toEqual(originalHistory);
  });

  it('should drop appending and then removing the same group without mutating history', () => {
    const originalGroups = ['A', 'B', 'C', 'D', 'E'].map((description) => ({
      cards: [],
      description,
    }));
    const appendedGroup = { cards: [], description: 'new' };
    const groupsAfterAppend = [...originalGroups, appendedGroup];
    const history = [
      setAction('莱特宁.knowledgeCardGroups.5', undefined, appendedGroup),
      setAction('莱特宁.knowledgeCardGroups', groupsAfterAppend, originalGroups),
    ];
    const originalHistory = structuredClone(history);

    expect(
      squashActions(history, {
        currentRoot: {
          莱特宁: {
            knowledgeCardGroups: originalGroups,
          },
        },
      })
    ).toEqual([]);
    expect(history).toEqual(originalHistory);
  });

  it('should collapse middle-index array deletion with shifted items to one parent array set', () => {
    const oldSkills = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const newSkills = [{ name: 'A' }, { name: 'C' }];

    expect(
      squashActions(
        [
          setAction('汤姆.skills.1', { name: 'B' }, { name: 'C' }),
          deleteAction('汤姆.skills.2', { name: 'C' }),
          setAction('汤姆.skills.length', 3, 2),
        ],
        {
          currentRoot: {
            汤姆: {
              skills: newSkills,
            },
          },
        }
      )
    ).toEqual([setAction('汤姆.skills', oldSkills, newSkills)]);
  });

  it('should preserve detailed structural actions when no current root is provided', () => {
    const actions = [
      deleteAction('玛丽.specialSkills.1', marySpecialSkillsOriginal[1]),
      setAction('玛丽.specialSkills.length', 2, 1),
    ];

    expect(squashActions(actions)).toEqual(actions);
  });

  it('should preserve detailed structural actions when the candidate parent is not an array', () => {
    const actions = [
      deleteAction('玛丽.specialSkills.1', marySpecialSkillsOriginal[1]),
      setAction('玛丽.specialSkills.length', 2, 1),
    ];

    expect(
      squashActions(actions, {
        currentRoot: {
          玛丽: {
            specialSkills: {
              length: 1,
            },
          },
        },
      })
    ).toEqual(actions);
  });

  it('should continue squashing unrelated scalar sets while normalizing a structural array parent', () => {
    expect(
      squashActions(
        [
          deleteAction('玛丽.specialSkills.1', marySpecialSkillsOriginal[1]),
          setAction('玛丽.specialSkills.length', 2, 1),
          setAction('玛丽.description', 'old', 'draft'),
          setAction('玛丽.description', 'draft', 'final'),
        ],
        {
          currentRoot: {
            玛丽: {
              description: 'final',
              specialSkills: marySpecialSkillsFinal,
            },
          },
        }
      )
    ).toEqual([
      setAction('玛丽.specialSkills', marySpecialSkillsOriginal, marySpecialSkillsFinal),
      setAction('玛丽.description', 'old', 'final'),
    ]);
  });
});
