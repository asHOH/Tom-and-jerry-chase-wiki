# Icon Button Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared `IconButton` primitive for small add/delete/edit controls and enforce it in migrated detail edit surfaces.

**Architecture:** Create a narrow icon-only primitive with required semantic `variant`, then migrate existing small controls through established boundaries first. Alias buttons go through `AddAliasButton`; character detail edit controls use `IconButton` directly. `RelationItemSelector` is intentionally excluded because its yellow/blue/purple tone API needs a separate tone-preserving design.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, Tailwind CSS 4, Jest, React Testing Library, Oxlint.

---

## Decisions

- `IconButton` is icon-only. Text+icon actions continue to use `Button`.
- Supported variants: `add`, `delete`, `edit` only.
- Supported sizes: `xs`, `sm`, `md`.
- `variant` and `aria-label` are required props.
- The first implementation renders only `<button>`.
- Colors: add is green, delete is red, edit is blue.
- `AddAliasButton` is the alias boundary.
- `RelationItemSelector` stays out of scope for this pass.
- Migrating `AddAliasButton` also updates existing entity/item/fixture alias buttons because those surfaces already use the shared component.
- Staging commands must use exact file paths or exact path arrays; do not stage whole feature directories.

## Path Groups

Core UI files:

```powershell
$iconFiles = @(
  'src/components/ui/IconButton.tsx',
  'src/components/ui/IconButton.test.tsx'
)
$aliasButtonFiles = @(
  'src/features/shared/detail-view/AddAliasButton.tsx',
  'src/features/shared/detail-view/AddAliasButton.test.tsx'
)
$editButtonFiles = @(
  'src/components/ui/EditButton.tsx',
  'src/components/ui/EditButton.test.tsx'
)
```

Alias target files:

```powershell
$aliasTargetFiles = @(
  'src/features/achievements/achievement-detail/AchievementAttributesCard.tsx',
  'src/features/buffs/components/buff-detail/BuffAttributesCard.tsx',
  'src/features/characters/components/character-detail/character-attributes/AttributeDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillCard.tsx',
  'src/features/knowledge-cards/components/knowledge-card-detail/KnowledgeCardAttributesCard.tsx',
  'src/features/maps/map-detail/MapAttributesCard.tsx',
  'src/features/modes/components/mode-detail/ModeAttributesCard.tsx',
  'src/features/special-skills/components/special-skill-detail/SpecialSkillAttributesCard.tsx'
)
```

Character detail target files:

```powershell
$characterDetailTargetFiles = @(
  'src/features/characters/components/character-detail/CharacterDetails.tsx',
  'src/features/characters/components/character-detail/positioning-tags/PositioningTagsSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardSection.tsx',
  'src/features/characters/components/character-detail/knowledge-cards/KnowledgeCardGroupSetDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationDisplay.tsx',
  'src/features/characters/components/character-detail/skills/SkillAllocationSection.tsx',
  'src/features/characters/components/character-detail/skills/SkillCard.tsx',
  'src/features/characters/components/character-detail/skills/SpecialSkillsSection.tsx',
  'src/features/characters/components/character-detail/character-relations/CharacterRelationPanel.tsx'
)
$styleTestFile = 'src/lib/uiStyleConsistency.test.ts'
```

Use the arrays above in any PowerShell session that runs the staging or raw-style scan commands below.

---

### Task 1: Add IconButton Primitive

**Files:** `$iconFiles`

- [ ] **Step 1: Write failing tests**

Create `src/components/ui/IconButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';

import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';

describe('IconButton', () => {
  it("should default to type='button'", () => {
    render(
      <IconButton aria-label='添加' variant='add'>
        +
      </IconButton>
    );

    expect(screen.getByRole('button', { name: '添加' })).toHaveAttribute('type', 'button');
  });

  it('should apply add variant and md size by default', () => {
    render(
      <IconButton aria-label='添加' variant='add'>
        +
      </IconButton>
    );

    expect(screen.getByRole('button', { name: '添加' })).toHaveClass(
      'h-8',
      'w-8',
      'bg-green-600',
      'text-white'
    );
  });

  it('should support delete, edit, and child icon size classes', () => {
    render(
      <>
        <IconButton aria-label='删除' variant='delete' size='xs' className='ml-auto'>
          -
        </IconButton>
        <IconButton aria-label='编辑' variant='edit' size='sm'>
          E
        </IconButton>
      </>
    );

    expect(screen.getByRole('button', { name: '删除' })).toHaveClass(
      'h-4',
      'w-4',
      'bg-red-500',
      'ml-auto'
    );
    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass('h-7', 'w-7', 'bg-blue-500');
    expect(getIconButtonIconClassName('xs')).toBe('h-3 w-3');
    expect(getIconButtonIconClassName('sm')).toBe('h-3.5 w-3.5');
    expect(getIconButtonIconClassName('md')).toBe('h-4 w-4');
  });
});
```

- [ ] **Step 2: Verify the test fails**

```powershell
npm test -- src/components/ui/IconButton.test.tsx
```

Expected: FAIL because `src/components/ui/IconButton.tsx` does not exist.

- [ ] **Step 3: Implement the primitive**

Create `src/components/ui/IconButton.tsx`:

```tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/design';

export type IconButtonVariant = 'add' | 'delete' | 'edit';
export type IconButtonSize = 'xs' | 'sm' | 'md';

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & {
  'aria-label': string;
  variant: IconButtonVariant;
  size?: IconButtonSize;
};

const variantClasses: Record<IconButtonVariant, string> = {
  add: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600',
  delete: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700',
  edit: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
};

const sizeClasses: Record<IconButtonSize, string> = {
  xs: 'h-4 w-4 text-xs',
  sm: 'h-7 w-7 text-xs',
  md: 'h-8 w-8 text-sm',
};

const iconSizeClasses: Record<IconButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
};

export function getIconButtonIconClassName(size: IconButtonSize = 'md'): string {
  return iconSizeClasses[size];
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant, size = 'md', className, disabled, type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border-none font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);

IconButton.displayName = 'IconButton';

export default IconButton;
```

- [ ] **Step 4: Pass tests and commit**

```powershell
npm test -- src/components/ui/IconButton.test.tsx
git add $iconFiles
git commit -m "feat(ui): add icon button primitive"
```

---

### Task 2: Migrate AddAliasButton

**Files:** `$aliasButtonFiles`

- [ ] **Step 1: Replace the test**

Replace `src/features/shared/detail-view/AddAliasButton.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';

import AddAliasButton from './AddAliasButton';

describe('AddAliasButton', () => {
  it('renders an accessible add icon button and calls onAdd', () => {
    const onAdd = jest.fn();

    render(<AddAliasButton onAdd={onAdd} />);

    const button = screen.getByRole('button', { name: '添加别名' });
    expect(button).toHaveClass('h-4', 'w-4', 'bg-green-600');

    fireEvent.click(button);

    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Verify the test fails**

```powershell
npm test -- src/features/shared/detail-view/AddAliasButton.test.tsx
```

Expected: FAIL because `AddAliasButton` still uses yellow classes.

- [ ] **Step 3: Replace AddAliasButton**

Replace `src/features/shared/detail-view/AddAliasButton.tsx`:

```tsx
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon } from '@/components/icons/CommonIcons';

type AddAliasButtonProps = {
  onAdd: () => void;
};

export default function AddAliasButton({ onAdd }: AddAliasButtonProps) {
  return (
    <IconButton
      type='button'
      aria-label='添加别名'
      variant='add'
      size='xs'
      className='ml-2'
      onClick={onAdd}
    >
      <PlusIcon className={getIconButtonIconClassName('xs')} aria-hidden='true' />
    </IconButton>
  );
}
```

- [ ] **Step 4: Pass tests and commit**

```powershell
npm test -- src/features/shared/detail-view/AddAliasButton.test.tsx
git add $aliasButtonFiles
git commit -m "refactor(ui): use icon button for alias add"
```

---

### Task 3: Convert Compact EditButton

**Files:** `$editButtonFiles`

- [ ] **Step 1: Add the test**

Create `src/components/ui/EditButton.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';

import EditButton from '@/components/ui/EditButton';

const mockEnterEditMode = jest.fn();

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({ enterEditMode: mockEnterEditMode }),
}));

describe('EditButton', () => {
  beforeEach(() => {
    mockEnterEditMode.mockClear();
  });

  it('should render compact edit as a blue icon button', () => {
    render(<EditButton compact />);

    const button = screen.getByRole('button', { name: '编辑此页面' });
    expect(button).toHaveClass('h-7', 'w-7', 'bg-blue-500');
    expect(screen.queryByText('编辑')).not.toBeInTheDocument();
  });

  it('should render full edit as a primary button', () => {
    render(<EditButton />);

    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass('bg-blue-600', 'text-white');
  });
});
```

- [ ] **Step 2: Verify the test fails**

```powershell
npm test -- src/components/ui/EditButton.test.tsx
```

Expected: FAIL because compact `EditButton` still uses raw compact classes.
Expected also covers full mode because the current implementation uses one raw amber `<button>` path instead of the shared `Button` primitive.

- [ ] **Step 3: Replace EditButton implementation**

Replace `src/components/ui/EditButton.tsx` with:

```tsx
'use client';

import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import Button from '@/components/ui/Button';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PencilSquareIcon } from '@/components/icons/CommonIcons';

export type EditButtonProps = {
  className?: string;
  compact?: boolean;
};

export default function EditButton({ className, compact = false }: EditButtonProps) {
  const { enterEditMode } = useSearchParamEditMode();
  const title = '编辑此页面';

  if (compact) {
    return (
      <IconButton
        type='button'
        aria-label={title}
        title={title}
        variant='edit'
        size='sm'
        className={className}
        onClick={enterEditMode}
      >
        <PencilSquareIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
      </IconButton>
    );
  }

  return (
    <Button
      type='button'
      variant='primary'
      size='sm'
      className={className}
      onClick={enterEditMode}
      leadingIcon={<PencilSquareIcon className='h-4 w-4' aria-hidden='true' />}
      title={title}
    >
      编辑
    </Button>
  );
}
```

- [ ] **Step 4: Pass tests and commit**

```powershell
npm test -- src/components/ui/EditButton.test.tsx
git add $editButtonFiles
git commit -m "refactor(ui): use icon button for compact edit"
```

---

### Task 4: Enforce And Migrate Alias Buttons

**Files:** `$styleTestFile`, `$aliasTargetFiles`

- [ ] **Step 1: Add failing style coverage**

In `src/lib/uiStyleConsistency.test.ts`, add `aliasIconPrimitiveTargets` using the exact strings from `$aliasTargetFiles`, then add:

```ts
const rawAliasAddButtonPattern =
  /<button\b(?=[\s\S]{0,800}aria-label='添加别名')(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawAliasAddButton = (source: string) => rawAliasAddButtonPattern.test(source);

it('uses AddAliasButton for migrated alias add controls', () => {
  const offenders = aliasIconPrimitiveTargets.filter((relativePath) => {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    return !source.includes('<AddAliasButton') || hasRawAliasAddButton(source);
  });

  expect(offenders).toEqual([]);
});
```

This alias test intentionally checks for raw `aria-label='添加别名'` buttons instead of broad color tokens. `SkillCard.tsx` is also a character-detail target and still has a raw red remove button until Task 5.

- [ ] **Step 2: Verify the test fails**

```powershell
npm test -- src/lib/uiStyleConsistency.test.ts
```

Expected: FAIL with alias files that still render raw `aria-label='添加别名'` buttons or do not use `AddAliasButton`.

- [ ] **Step 3: Replace alias add buttons**

In every alias target, import `AddAliasButton` and remove now-unused `PlusIcon` imports:

```ts
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
```

Use this replacement pattern for the one-file raw objects:

```tsx
<AddAliasButton
  onAdd={() => {
    if (!rawItem) return;
    if (!rawItem.aliases) rawItem.aliases = [];
    if (!rawItem.aliases.includes('新别名')) {
      rawItem.aliases.push('新别名');
    }
  }}
/>
```

Variable mapping: `AchievementAttributesCard.tsx` uses `rawAchievement`; `BuffAttributesCard.tsx` uses `rawBuff`; `KnowledgeCardAttributesCard.tsx` uses `rawCard`; `MapAttributesCard.tsx` uses `rawMap`; `ModeAttributesCard.tsx` uses `rawMode`; `SpecialSkillAttributesCard.tsx` uses `rawSkill`.

For `AttributeDisplay.tsx`, the body is:

```tsx
const character = characters[characterId]!;
if (!character.aliases) character.aliases = [];
if (!character.aliases.includes('新别名')) character.aliases.push('新别名');
```

For `SkillCard.tsx`, the body is:

```tsx
const skill = characters[characterId]!.skills[skillIndex]!;
if (!skill.aliases) skill.aliases = [];
if (!skill.aliases.includes('新别名')) skill.aliases.push('新别名');
```

- [ ] **Step 4: Pass tests and commit**

```powershell
npm test -- src/lib/uiStyleConsistency.test.ts
git add $styleTestFile $aliasTargetFiles
git commit -m "refactor(ui): use alias button in detail cards"
```

---

### Task 5: Enforce And Migrate Character Detail Icon Controls

**Files:** `$styleTestFile`, `$characterDetailTargetFiles`

- [ ] **Step 1: Add failing style coverage**

In `src/lib/uiStyleConsistency.test.ts`, add `characterDetailIconPrimitiveTargets` using the exact strings from `$characterDetailTargetFiles`, then add:

```ts
const rawMigratedIconButtonPattern =
  /<button\b(?=[\s\S]{0,800}(?:h-4 w-4|h-7 w-7|h-8 w-8))(?=[\s\S]{0,800}(?:bg-yellow-500|bg-red-500|bg-blue-500|bg-green-600|dark:bg-yellow-600|dark:bg-red-600|dark:bg-blue-600))(?=[\s\S]{0,800}<\/button>)[\s\S]{0,800}<\/button>/;

const hasRawMigratedIconButton = (source: string) => rawMigratedIconButtonPattern.test(source);

it('uses IconButton for migrated character detail edit controls', () => {
  const offenders = characterDetailIconPrimitiveTargets.filter((relativePath) => {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    return !source.includes('<IconButton') || hasRawMigratedIconButton(source);
  });

  expect(offenders).toEqual([]);
});
```

This test has both a positive convention check (`<IconButton`) and a raw-button check, so a hand-rolled green replacement cannot satisfy the convention.

- [ ] **Step 2: Verify the test fails**

```powershell
npm test -- src/lib/uiStyleConsistency.test.ts
```

Expected: FAIL with character detail files that still contain raw small icon-button color tokens.

- [ ] **Step 3: Replace raw controls**

In each file that renders migrated add/delete/edit icon buttons, import:

```ts
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
```

Use `variant='add'` for add controls, `variant='delete'` for delete controls, and `variant='edit'` for the two blue edit buttons in `KnowledgeCardSection.tsx`. Use `size='md'` for current `h-8 w-8` buttons and `size='sm'` for current `h-7 w-7` buttons.

Canonical examples:

```tsx
<IconButton type='button' aria-label='添加第二武器' onClick={addSecondWeapon} variant='add' size='md'>
  <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
</IconButton>

<IconButton type='button' aria-label='移除关系' onClick={() => item.onRemove?.()} variant='delete' size='sm' className='ml-auto'>
  <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
</IconButton>

<IconButton type='button' aria-label='编辑知识卡组' onClick={() => handleEditClick(index)} variant='edit' size='md'>
  <PencilSquareIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
</IconButton>
```

Keep existing handlers, keys, class names, and conditional rendering unless replacing the raw button requires moving them onto `IconButton`.

- [ ] **Step 4: Preserve RelationItemSelector**

Do not change `src/features/characters/components/character-detail/character-relations/RelationItemSelector.tsx`. Its `tone: 'yellow' | 'blue' | 'purple'`, `triggerAriaLabel`, `setIsOpen`, and `disabled` behavior are preserved by excluding it from this pass.

- [ ] **Step 5: Pass tests and commit**

```powershell
npm test -- src/lib/uiStyleConsistency.test.ts
git add $styleTestFile $characterDetailTargetFiles
git commit -m "refactor(characters): standardize detail icon actions"
```

---

### Task 6: Final Verification

**Files:** all path groups above.

- [ ] **Step 1: Run targeted tests**

```powershell
npm test -- src/components/ui/IconButton.test.tsx src/features/shared/detail-view/AddAliasButton.test.tsx src/components/ui/EditButton.test.tsx src/lib/uiStyleConsistency.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run project checks**

```powershell
npm run lint
npm run type-check
```

Expected: both PASS with zero lint warnings.

- [ ] **Step 3: Run focused raw-style scan**

```powershell
rg -n "bg-yellow-500|bg-red-500|bg-blue-500|bg-green-600|dark:bg-yellow-600|dark:bg-red-600|dark:bg-blue-600" $aliasTargetFiles $characterDetailTargetFiles
```

Expected: no output.

- [ ] **Step 4: Stage any verification fixes exactly**

If verification required edits:

```powershell
git add $iconFiles $aliasButtonFiles $editButtonFiles $styleTestFile $aliasTargetFiles $characterDetailTargetFiles
git commit -m "test(ui): enforce icon button convention"
```

---

## Self-Review

**Spec coverage:** Covers convention enforcement, icon-only controls, add/delete/edit variants, required `variant`, required `aria-label`, `AddAliasButton` reuse, indirect entity/item/fixture alias button visual changes through `AddAliasButton`, blue edit migration, correct `h-7 w-7` to `size='sm'` mapping, and exact staging via path arrays.

**Placeholder and type scan:** No unresolved implementation markers or invented handler names. `RelationItemSelector` is only referenced as excluded. `IconButtonVariant`, `IconButtonSize`, and `getIconButtonIconClassName` are defined in Task 1 and referenced consistently later.
