# Design Document

## Overview

This design centralizes image URL generation logic from multiple scattered functions into a single `AssetManager` class. The current implementation has three separate functions (`getCatImageUrl`, `getMouseImageUrl`, and `getSkillImageUrl`) that follow similar patterns but are defined in different files, leading to code duplication and maintenance overhead.

## Architecture

### Current State Analysis

**Scattered Functions:**

- `getCatImageUrl()` in `src/data/catCharacters.ts`
- `getMouseImageUrl()` in `src/data/mouseCharacters.ts`
- `getSkillImageUrl()` in `src/lib/skillUtils.ts`

**Usage Patterns:**

- Character images: Used in data processing, edit utilities, and UI components
- Skill images: Used in skill processing and character data enhancement
- Multiple files import these functions directly

### Target Architecture

**Centralized AssetManager:**

```
src/lib/assetManager.ts
├── AssetManager class
├── Character image URL generation
├── Skill image URL generation
├── Special skill image URL generation
└── Card image URL generation
```

## Components and Interfaces

### AssetManager Class

```typescript
export class AssetManager {
  // Character image URLs
  static getCharacterImageUrl(characterId: string, factionId: FactionId): string;

  // Skill image URLs
  static getSkillImageUrl(characterName: string, skill: Skill, factionId: FactionId): string;

  // Special skill image URLs
  static getSpecialSkillImageUrl(skillName: string, factionId: FactionId): string;

  // Card image URLs
  static getCardImageUrl(cardId: string, factionId: FactionId): string;

  // Batch processing for skills
  static addSkillImageUrls(characterName: string, skills: Skill[], factionId: FactionId): Skill[];

  // Private helper methods
  private static getSkillNumber(skillType: SkillType): string;
  private static getFactionDisplayName(factionId: FactionId): string;
}
```

### URL Pattern Mapping

**Character Images:**

- Cats: `/images/cats/{characterId}.png`
- Mice: `/images/mice/{characterId}.png`

**Skill Images:**

- Active skills: `/images/{factionId}Skills/{characterName}1-{skillName}.png`
- Weapon1 skills: `/images/{factionId}Skills/{characterName}2-{skillName}.png`
- Weapon2 skills: `/images/{factionId}Skills/{characterName}3-{skillName}.png`
- Passive skills: `/images/{factionId}Skills/被动-{factionDisplayName}.png`

**Special Skill Images:**

- `/images/specialSkills/{skillName}-{factionDisplayName}.png`

**Card Images:**

- `/images/{factionId}Cards/{cardId}.png`

### Type Definitions

```typescript
// Asset types for future extensibility
export type AssetType = 'character' | 'skill' | 'specialSkill' | 'card' | 'item';
```

## Data Models

### Input Parameters

**Character Image Generation:**

```typescript
interface CharacterImageParams {
  characterId: string;
  factionId: FactionId;
}
```

**Skill Image Generation:**

```typescript
interface SkillImageParams {
  characterName: string;
  skill: Skill;
  factionId: FactionId;
}
```

**Special Skill Image Generation:**

```typescript
interface SpecialSkillImageParams {
  skillName: string;
  factionId: FactionId;
}
```

### Output Format

All methods return standardized URL strings following the existing patterns.

## Error Handling

### Input Validation

- Validate `factionId` is either 'cat' or 'mouse'
- Validate required parameters are provided
- Validate skill types are supported

### Error Response Strategy

```typescript
// Clear error messages for debugging
throw new Error(`Invalid faction ID: ${factionId}. Expected 'cat' or 'mouse'.`);
```

## Testing Strategy

### Unit Tests

```typescript
describe('AssetManager', () => {
  describe('getCharacterImageUrl', () => {
    it('should generate correct cat character URLs');
    it('should generate correct mouse character URLs');
    it('should throw error for invalid faction');
  });

  describe('getSkillImageUrl', () => {
    it('should generate correct active skill URLs');
    it('should generate correct weapon skill URLs');
    it('should generate correct passive skill URLs');
  });

  describe('getSpecialSkillImageUrl', () => {
    it('should generate correct special skill URLs');
  });

  describe('getCardImageUrl', () => {
    it('should generate correct card URLs');
  });
});
```

### Integration Tests

```typescript
describe('AssetManager Integration', () => {
  it('should produce identical URLs to legacy functions');
  it('should work with existing character data processing');
  it('should work with existing skill processing');
});
```

## Implementation Plan

### Single Phase Implementation

1. Create `src/lib/assetManager.ts` with all methods
2. Replace all existing image URL generation functions
3. Update all importing files to use AssetManager
4. Add comprehensive unit tests
5. Run full test suite to ensure no regressions

## Performance Considerations

### Optimization Strategies

- Static methods to avoid instantiation overhead
- Minimal string concatenation operations
- Reuse of common path segments
- No external dependencies

### Memory Usage

- No instance state to manage
- Minimal memory footprint
- Efficient string operations

## Security Considerations

### Input Validation

- Validate all input parameters to prevent invalid URLs
- Ensure generated URLs follow expected patterns
