# Technology Stack

## Core Framework

- **Next.js 15** with App Router architecture
- **React 19** with TypeScript for type safety
- **Node.js >=20.0.0** and **npm >=10.0.0** required

## Styling & UI

- **Tailwind CSS 4** for utility-first styling
- Custom design system with predefined color schemes for game elements
- Responsive design with mobile-first approach
- Safelist configuration for dynamic color classes

## State Management & Data

- **Valtio** for reactive state management
- **SWR** for data fetching and caching
- **Immer** for immutable state updates
- Static TypeScript data files for game content

## Development Tools

- **TypeScript** with strict configuration and additional checks
- **ESLint** with Next.js, Testing Library, and Storybook plugins
- **Prettier** for code formatting (single quotes, 100 char width)
- **Husky** for git hooks with pre-commit, pre-push validation

## Testing

- **Jest** with jsdom environment
- **React Testing Library** for component testing
- **Storybook** for component development and documentation
- Coverage reporting with lcov and HTML formats

## Build & Deployment

- **Vercel** for hosting and deployment
- **PWA** capabilities with next-pwa and service worker
- **Bundle Analyzer** for performance optimization
- **MDX** support for documentation

## Performance & Analytics

- **Vercel Analytics** and **Speed Insights**
- Custom performance monitoring
- Image optimization and caching strategies
- Runtime caching for offline functionality

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Production build
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format with Prettier + ESLint
npm run type-check      # TypeScript type checking

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
npm run test:ci         # CI optimized testing

# Utilities
npm run clean           # Clean build artifacts
npm run analyze         # Bundle analysis
npm run storybook       # Start Storybook
```

## Code Style Requirements

- Use TypeScript strict mode with additional checks
- Single quotes, semicolons, 2-space indentation
- 100 character line width
- Trailing commas in ES5 contexts
- LF line endings
