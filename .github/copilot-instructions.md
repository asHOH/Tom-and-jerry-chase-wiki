# Project Information

This is a fan-made wiki website for the mobile game "Tom and Jerry Chase" (猫和老鼠手游). The site provides comprehensive data and tools for players to look up character information, knowledge cards, and game mechanics.

- **Type**: Next.js Application
- **Framework**: Next.js 15 with App Router architecture
- **React**: React 19 with TypeScript for type safety
- **Deployment**: Vercel
- **Language**: Chinese (zh-CN)
- **Architecture**: Client-side and Server-side (Next.js)
- **Security**: Standard Next.js security practices
- **Target Audience**: Chinese-speaking players of the Tom and Jerry Chase mobile game

## Core Features

- **Character Database**: Detailed information about cat and mouse characters including stats, skills, and recommended builds
- **Knowledge Cards**: Complete database of knowledge cards with effects and filtering capabilities
- **Search & Filter**: Advanced search and filtering system with Chinese pinyin support
- **Skill Point Calculator**: Tools for optimizing character skill allocations
- **Progressive Web App**: Offline-capable PWA with caching for mobile users

# Technology Stack

## Styling & UI

- **Tailwind CSS 4** for utility-first styling
- Custom design system with predefined color schemes for game elements
- Responsive design with mobile-first approach

## State Management & Data

- **Valtio** for reactive state management
- **SWR** for data fetching and caching
- **Immer** for immutable state updates
- Static TypeScript data files for game content

## Development Tools

- **ESLint** with Next.js, Testing Library, and Storybook plugins
- **Prettier** for code formatting (single quotes, 100 char width)
- **Husky** for git hooks with pre-commit, pre-push validation

## Testing

- **Jest** with jsdom environment
- **React Testing Library** for component testing
- **Storybook** for component development and documentation

## Build & Deployment

- **Vercel** for hosting and deployment
- **PWA** capabilities with next-pwa and service worker
- **MDX** support for documentation

## Performance & Analytics

- **Vercel Analytics** and **Speed Insights**
- Image optimization and caching strategies
- Runtime caching for offline functionality

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

## Import Conventions

- Use `@/` path alias for `src/` directory
- Group imports: external libraries, internal modules, relative imports
- Prefer named exports over default exports for utilities

# Key Principles

- **Data Accuracy**: Precise character stats and skill descriptions are critical
- **Performance**: Fast loading and responsive design for mobile gaming scenarios
- **Accessibility**: Clean, intuitive interface that works well on mobile devices
- **Community-Driven**: Open source project welcoming contributions from the gaming community
- **Compatibility**: Ensure backward compatibility of import characters function in EditMode

# Reply Rules

## Reply style

- Be concise! Eliminate filler words.

## Comment Edit Rules

- Use meaningful variable/function names over comments
- Add comments only for: complex logic, non-obvious algorithms, or public APIs

## Command Line Syntax

- Use PowerShell syntax: `;` instead of `&&`, etc.

# Code Standards

- Follow project's existing patterns
- Ensure TypeScript strict mode compliance
- Write features with least net code increase
- Avoid inline scripts/styles and use build-time bundling for CSP compliance (though not required)
- Ensure your implementation plan complies with best practices before and after editing
- Optimize for static delivery and client-side hydration

# Things to do After Editing

- Run the following commands to ensure code quality:

```Powershell
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
```

- Write a draft commit message with `feat|fix|docs|style|refactor|perf|test|chore(scope): ...` as a reference.
