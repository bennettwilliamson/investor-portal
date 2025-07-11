# Alturas Real Estate Fund – Investor Portal

## Tech Stack

- Framework: **Next.js** (React 18) with the **App Router**
- Language: **TypeScript**
- Styling: **SCSS Modules** + CSS custom-property design tokens
- State/Data: Static mock JSON (to be replaced by Azure SQL backend later)
- Auth: TBD (authentication platform to be determined)
- Hosting: Vercel
- Linting/Formatting: ESLint (Next.js core-web-vitals) + Prettier

## Architectural Decisions

1. **Single-app repository** (no monorepo needed)
2. **TypeScript** across the codebase for early type-safety
3. **Next.js** chosen now for long-term Azure SQL compatibility and first-class Vercel support
4. **Dark theme** by default: black background, white/gray text, Alturas blue `#0C40FF` accents
5. **Component-centric layout** (Header, StatCard, Section, ChartPlaceholder)
6. **Mock data** lives in `src/data/dashboardData.ts`
7. **SCSS Modules** over Tailwind to avoid framework lock-in while keeping styles scoped
8. **CI/CD** handled by Vercel preview deployments on every PR

## Getting Started

```bash
# install dependencies
npm install

# run dev server
npm run dev

# build for production
npm run build

# start the production build locally
npm run start

# lint fixable issues
npm run lint
```

## Deployment

Push to any branch and Vercel will create a preview deployment. The `main` branch auto-deploys to production.

## Future Work

- Integrate authentication platform (TBD)
- Replace mock data with API routes backed by Azure SQL
- Implement historical returns chart
- Add unit & integration tests