# TravelSafer 개발 가이드

이 문서는 로컬 개발과 배포 작업에 필요한 최소 절차를 정리합니다.

## Project Shape

```text
src/                     Shared TypeScript modules
supabase/functions/      Edge Functions
supabase/migrations/     Database migrations
supabase/seed.sql        Seed data
docs/                    VitePress documentation
AI-Sessions/wiki/        Business and design knowledge base
```

## Main Functions

| Function | Role |
|----------|------|
| `health` | Service health check |
| `vasp-registry` | VASP and public key lifecycle |
| `transfer-auth` | Travel Rule relay and status |
| `owner-check` | Identical Account Owner Verification |
| `transfer-response` | Legacy compatibility |

## Local Commands

```bash
npm install
npm run typecheck
npm run test:run -- --passWithNoTests
npm run docs:dev
npm run docs:build
```

`npm run dev` starts local Supabase and requires Docker Desktop. For ordinary document and TypeScript edits, it is usually enough to run `typecheck`, tests, and `docs:build`.

## Supabase Deploy

```bash
npx supabase functions deploy health --project-ref <project-ref>
npx supabase functions deploy vasp-registry --project-ref <project-ref>
npx supabase functions deploy transfer-auth --project-ref <project-ref>
npx supabase functions deploy owner-check --project-ref <project-ref>
npx supabase functions deploy transfer-response --project-ref <project-ref>
```

## Secrets

```bash
npx supabase secrets set TRAVELSAFER_HUB_VASP_ENTITY_ID=bonanza
npx supabase secrets set BONANZA_ALLIANCE_PREFIX=bonanza
npx supabase secrets set BONANZA_SIGNING_PRIVATE_KEY=<base64-private-key>
npx supabase secrets set BONANZA_SIGNING_PUBLIC_KEY=<base64-public-key>
npx supabase secrets set TRAVELSAFER_CALLBACK_BASE_URL=https://<callback-host>
npx supabase secrets set KYT_API_BASE_URL=https://<kyt-host>
npx supabase secrets set KYT_API_KEY=<kyt-api-key>
```

Do not commit API keys, tokens, customer data, private keys, or confidential source material.

## Verification Before Commit

```bash
npm run typecheck
npm run test:run -- --passWithNoTests
npm run docs:build
```

If Supabase or Deno is unavailable locally, record the limitation in the handoff or final report.
