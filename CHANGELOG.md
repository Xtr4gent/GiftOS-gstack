# Changelog

## 0.1.1.0 - 2026-03-30

- fix dashboard and history ordering so the newest same-day gift is shown consistently as the latest gift
- add regression tests for same-day ordering in dashboard and history read models
- harden gift image reads so missing files fail as `404` instead of bubbling into `502` errors
- add regression coverage for the gift image route when stored files are missing
- add Railway deploy configuration guidance to support the hosted release workflow

## 0.1.0.1 - 2026-03-29

- bootstrap GiftOS as a Next.js app with owner login, PostgreSQL persistence, and Railway-compatible uploads
- add dashboard, gifts, history, and settings pages for the phase 1 product slice
- add Drizzle schema, migrations, owner seeding, and local development setup
- add Vitest coverage, QA baseline artifacts, and fixes for dashboard spend tracking plus session sign-out
