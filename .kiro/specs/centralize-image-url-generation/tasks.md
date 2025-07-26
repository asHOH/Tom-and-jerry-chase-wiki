# Implementation Plan

- [x] 1. Create AssetManager utility class
  - Create `src/lib/assetManager.ts` with all image URL generation methods
  - Implement `getCharacterImageUrl`, `getSkillImageUrl`, `getSpecialSkillImageUrl`, `getCardImageUrl`, and `addSkillImageUrls`
  - Include basic input validation and TypeScript types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Replace character image URL functions
  - Update `src/data/catCharacters.ts` and `src/data/mouseCharacters.ts` to use AssetManager
  - Remove old `getCatImageUrl` and `getMouseImageUrl` functions
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 3. Replace skill image URL functions
  - Update `src/lib/skillUtils.ts` to use AssetManager methods
  - Remove old `getSkillImageUrl`, `addSkillImageUrls`, and helper functions
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Update all importing files
  - Update `src/lib/editUtils.ts`, `CharacterImport.tsx`, and `CharacterRelationDisplay.tsx`
  - Replace all imports and function calls to use AssetManager
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Test and verify functionality
  - Run the application to ensure all images load correctly
  - Verify no broken imports or missing functions
  - _Requirements: 4.2, 4.3, 6.4_
