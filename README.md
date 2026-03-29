# GiftOS

Private gift tracking for one relationship.

GiftOS is a hosted-first Next.js app for tracking gifts, spending, and occasion memory
in one place. The current phase 1 slice focuses on the core loop:

- owner login
- gift create/edit
- image uploads
- dashboard with upcoming occasions and year-to-date spend
- gift history
- settings and recipient preferences

## Stack

- Next.js App Router
- Auth.js credentials auth
- Drizzle ORM
- PostgreSQL
- Railway Bucket compatible uploads
- Vitest
- Playwright

## Local setup

1. Copy env values from [`.env.example`](./.env.example) into `.env.local`
2. Start or configure PostgreSQL
3. Push the schema:

```bash
pnpm db:push
```

4. Seed the owner account:

```bash
pnpm seed:owner
```

5. Start the app:

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm db:generate
pnpm db:push
pnpm seed:owner
```

## Notes

- Local uploads fall back to `.local-uploads/` when S3-compatible env vars are not set.
- The repo intentionally ignores `.env.local`, `.gstack/`, `.codex/`, and local upload artifacts.
- The first QA baseline lives outside version control.
