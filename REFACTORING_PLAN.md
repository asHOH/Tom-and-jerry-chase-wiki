# Project Refactoring Plan

## Overview

Centralize data processing and reduce code duplication while maintaining the solid architectural foundation.

## 🎯 Priority Phases

### Phase 1: Data Processing Centralization (3-4 days)

**High Impact, Low Risk**

#### 1.1 Centralize Image URL Generation (1 day)

- **Current Issue**: Scattered across `catCharacters.ts`, `mouseCharacters.ts`, `skillUtils.ts`
- **Solution**: Create `src/lib/assetManager.ts`
- **Files to Refactor**:
  - `src/data/catCharacters.ts`
  - `src/data/mouseCharacters.ts`
  - `src/lib/skillUtils.ts`

#### 1.2 Unified Data Processing Pipeline (2-3 days)

- **Current Issue**: Processing scattered across `skillUtils.ts`, `skillIdUtils.ts`, `dataManager.ts`
- **Solution**: Create `src/lib/dataProcessor.ts`
- **Benefits**: Single source of truth for all data transformations

### Phase 2: Type System Reorganization (2-3 days)

**Medium Impact, Medium Risk**

#### 2.1 Split Large Types File (1-2 days)

- **Current Issue**: 400+ lines in single `types.ts` file
- **Solution**: Split into focused modules:
  ```
  src/types/
  ├── core.ts          # Basic game entities
  ├── character.ts     # Character-specific types
  ├── ui.ts           # UI component types
  └── processing.ts   # Data processing types
  ```

#### 2.2 Reorganize Utility Functions (1-2 days)

- **Current Issue**: 20+ individual utility files
- **Solution**: Group related utilities:
  ```
  src/lib/
  ├── data/           # Data processing utilities
  ├── ui/             # UI-related utilities
  ├── game/           # Game logic utilities
  └── core/           # Core utilities
  ```

### Phase 3: Quality Improvements (3-4 days)

**Low Impact, High Value**

#### 3.1 Data Validation Layer (2-3 days)

- Add runtime validation for character data
- Implement schema validation for API responses
- Create data integrity checks

#### 3.2 Consistent Error Handling (1-2 days)

- Standardize error handling patterns
- Add proper error boundaries
- Implement graceful degradation

## 🚫 What NOT to Change

### ✅ Well-Designed Areas (Keep As-Is)

- **Component Architecture**: Clean separation and appropriate sizing
- **Routing Structure**: Next.js App Router implementation is solid
- **State Management**: Valtio + SWR combination works well
- **Performance Optimizations**: Current caching and loading strategies are effective
- **Type Safety**: Comprehensive TypeScript usage is appropriate

## 📊 Expected Benefits

### Phase 1 Outcomes

- **Reduced Code Duplication**: ~30% reduction in duplicate logic
- **Improved Maintainability**: Single source of truth for data processing
- **Better Performance**: Optimized data transformation pipeline

### Phase 2 Outcomes

- **Better Developer Experience**: Clearer type organization
- **Reduced Cognitive Load**: Focused utility groupings
- **Easier Onboarding**: More intuitive project structure

### Phase 3 Outcomes

- **Increased Reliability**: Better error handling and validation
- **Improved User Experience**: Graceful error states
- **Better Debugging**: Consistent error reporting

## 🎯 Success Metrics

- [ ] Zero breaking changes to existing functionality
- [ ] Reduced lines of duplicate code by 30%
- [ ] Improved build time by 10-15%
- [ ] Maintained or improved type safety coverage
- [ ] All existing tests continue to pass

## ⚠️ Risk Mitigation

- **Incremental Changes**: Each phase can be implemented independently
- **Backward Compatibility**: Maintain existing APIs during transition
- **Testing**: Comprehensive testing after each phase
- **Rollback Plan**: Each change should be easily reversible

---

**Risk Level**: Low to Medium
**Impact Level**: High
