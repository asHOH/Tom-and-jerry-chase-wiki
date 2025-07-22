# Project Structure

## Root Directory Organization

```
├── .github/            # GitHub Actions workflows and templates
├── .husky/             # Git hooks configuration
├── .kiro/              # Kiro AI assistant configuration
├── .storybook/         # Storybook configuration
├── public/             # Static assets (images, PWA manifest, robots.txt)
├── src/                # Source code
├── scripts/            # Build and utility scripts
└── coverage/           # Test coverage reports
```

## Source Code Structure (`src/`)

### Core Directories

- **`app/`** - Next.js App Router pages and API routes
  - `api/` - Server-side API endpoints
  - `[feature]/` - Feature-based page routing (characters, cards, etc.)
  - Layout and metadata files

- **`components/`** - Reusable React components
  - `ui/` - Basic UI components (buttons, inputs, etc.)
  - `displays/` - Complex display components
  - Root-level utility components (ErrorBoundary, Analytics, etc.)

- **`data/`** - Game data and type definitions
  - Character data files (`catCharacters.ts`, `mouseCharacters.ts`)
  - Knowledge card data (`catKnowledgeCards.ts`, `mouseKnowledgeCards.ts`)
  - `types.ts` - TypeScript type definitions
  - `__tests__/` - Data validation tests

- **`lib/`** - Utility functions and business logic
  - Feature-specific utilities (`skillUtils.ts`, `filterUtils.ts`)
  - `searchUtils/` - Search functionality
  - `__tests__/` - Unit tests for utilities

- **`context/`** - React Context providers
  - `AppContext.tsx` - Global application state
  - `EditModeContext.tsx` - Edit mode functionality
  - `DarkModeContext.tsx` - Theme management

- **`constants/`** - Application constants and configuration

## File Naming Conventions

- **Components**: PascalCase (`CharacterCard.tsx`)
- **Utilities**: camelCase (`skillUtils.ts`)
- **Data files**: camelCase with descriptive names (`catCharacters.ts`)
- **Types**: PascalCase interfaces/types in `types.ts` files
- **Tests**: `__tests__/` directories or `.test.ts` suffix

## Architecture Patterns

### Data Layer

- Static TypeScript files for game data
- Centralized type definitions in `data/types.ts`
- Validation through TypeScript strict mode

### Component Architecture

- Functional components with hooks
- Context for global state management
- Utility functions separated from components
- Custom hooks in `lib/` directory

### Feature Organization

- Feature-based routing in `app/` directory
- Shared components in `components/`
- Feature-specific utilities in `lib/`
- Data organized by game entity type

### Testing Structure

- `__tests__/` directories alongside source files
- Unit tests for utilities and data validation
- Component tests using React Testing Library
- Coverage reports exclude data files

## Import Conventions

- Use `@/` path alias for `src/` directory
- Group imports: external libraries, internal modules, relative imports
- Prefer named exports over default exports for utilities
