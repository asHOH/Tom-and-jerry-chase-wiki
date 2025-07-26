# Requirements Document

## Introduction

This feature centralizes image URL generation logic that is currently scattered across multiple files (`catCharacters.ts`, `mouseCharacters.ts`, and `skillUtils.ts`) into a single, unified AssetManager utility. This refactoring will eliminate code duplication, provide a consistent API for generating asset URLs, and improve maintainability.

## Requirements

### Requirement 1

**User Story:** As a developer working with character data, I want a centralized way to generate character image URLs, so that I don't need to remember different functions for cats and mice.

#### Acceptance Criteria

1. WHEN I need a character image URL THEN the AssetManager SHALL provide a single method that works for both cat and mouse characters
2. WHEN I provide a character ID and faction THEN the system SHALL generate the correct image path following existing patterns
3. WHEN generating cat character URLs THEN the system SHALL use the pattern `/images/cats/{characterId}.png`
4. WHEN generating mouse character URLs THEN the system SHALL use the pattern `/images/mice/{characterId}.png`

### Requirement 2

**User Story:** As a developer working with skill data, I want a centralized way to generate skill image URLs, so that skill image generation logic is consistent and maintainable.

#### Acceptance Criteria

1. WHEN I need a skill image URL THEN the AssetManager SHALL provide a method that handles all skill types
2. WHEN generating active skill URLs THEN the system SHALL use the pattern `/images/{factionId}Skills/{characterName}1-{skillName}.png`
3. WHEN generating weapon1 skill URLs THEN the system SHALL use the pattern `/images/{factionId}Skills/{characterName}2-{skillName}.png`
4. WHEN generating weapon2 skill URLs THEN the system SHALL use the pattern `/images/{factionId}Skills/{characterName}3-{skillName}.png`
5. WHEN generating passive skill URLs THEN the system SHALL use the pattern `/images/{factionId}Skills/被动-{factionName}.png`

### Requirement 3

**User Story:** As a developer maintaining the codebase, I want the AssetManager to be easily extensible, so that I can add new asset types without modifying existing code.

#### Acceptance Criteria

1. WHEN new asset types are needed THEN the AssetManager SHALL support adding new methods without breaking existing functionality
2. WHEN the AssetManager is extended THEN it SHALL maintain consistent naming conventions and patterns
3. WHEN adding new asset types THEN the system SHALL follow TypeScript best practices for type safety

### Requirement 4

**User Story:** As a developer refactoring existing code, I want backward compatibility during the transition, so that I can migrate gradually without breaking the application.

#### Acceptance Criteria

1. WHEN the AssetManager is introduced THEN existing image URL generation functions SHALL continue to work
2. WHEN migrating to the AssetManager THEN the generated URLs SHALL be identical to the current implementation
3. WHEN both old and new methods exist THEN they SHALL produce the same output for the same inputs
4. WHEN the migration is complete THEN all old image URL generation functions SHALL be removed

### Requirement 5

**User Story:** As a developer working with the AssetManager, I want comprehensive TypeScript support, so that I get proper type checking and IDE support.

#### Acceptance Criteria

1. WHEN using the AssetManager THEN all methods SHALL have proper TypeScript type definitions
2. WHEN providing invalid parameters THEN TypeScript SHALL show compile-time errors
3. WHEN using the AssetManager in an IDE THEN I SHALL get proper autocomplete and documentation
4. WHEN the AssetManager methods are called THEN they SHALL enforce correct parameter types at compile time

### Requirement 6

**User Story:** As a developer debugging image loading issues, I want consistent error handling in the AssetManager, so that I can easily identify and fix problems.

#### Acceptance Criteria

1. WHEN invalid parameters are provided THEN the AssetManager SHALL provide clear error messages
2. WHEN debugging image URL generation THEN the AssetManager SHALL support logging or debugging modes
3. WHEN an asset type is not supported THEN the system SHALL provide a helpful error message
4. WHEN URL generation fails THEN the system SHALL handle errors gracefully without crashing
