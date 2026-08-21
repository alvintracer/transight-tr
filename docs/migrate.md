# Bonanza TTR 환경 구축 및 마이그레이션 가이드

마지막 업데이트: 2026-08-21

## Purpose

새 Supabase project 또는 다른 실행 환경에 Bonanza TTR을 재구축할 때 필요한 절차를 정리합니다.

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | TypeScript and VitePress |
| npm | 9+ | Package manager |
| Git | 2+ | Source control |
| Supabase CLI | 2+ | Database and Edge Function deploy |
| Docker Desktop | Optional | Local Supabase runtime |

## Environment Variables

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

BONANZA_HUB_VASP_ENTITY_ID=bonanza
BONANZA_ALLIANCE_PREFIX=bonanza
BONANZA_SIGNING_PRIVATE_KEY=<Base64 Ed25519 signing key>
BONANZA_SIGNING_PUBLIC_KEY=<Base64 Ed25519 public key>
BONANZA_TTR_CALLBACK_BASE_URL=https://<callback-host>

KYT_API_BASE_URL=<KYT API URL>
KYT_API_KEY=<KYT API Key>
```

Legacy names such as `TRANSIGHT_VASP_ENTITY_ID`, `CODE_API_PRIVATE_KEY`, and `CODE_API_PUBLIC_KEY` may still be recognized during migration, but new deployments should use the `BONANZA_*` names.

## Setup

```bash
git clone git@github.com:alvintracer/transight-tr.git
cd transight-tr
npm install
npx supabase login --token <access-token>
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase db query --linked -f supabase/seed.sql
```

## Deploy Functions

```bash
npx supabase functions deploy health --project-ref <project-ref>
npx supabase functions deploy vasp-registry --project-ref <project-ref>
npx supabase functions deploy transfer-auth --project-ref <project-ref>
npx supabase functions deploy owner-check --project-ref <project-ref>
npx supabase functions deploy transfer-response --project-ref <project-ref>
```

## Smoke Checks

```bash
curl -H "Authorization: Bearer <ANON_KEY>" \
  https://<project-ref>.supabase.co/functions/v1/health

curl -H "Authorization: Bearer <ANON_KEY>" \
  https://<project-ref>.supabase.co/functions/v1/vasp-registry

curl -H "Authorization: Bearer <ANON_KEY>" \
  https://<project-ref>.supabase.co/functions/v1/vasp-registry/pubkey/bonanza
```

Expected health response:

```json
{
  "status": "up",
  "service": "Bonanza TTR Gateway"
}
```

## Database Areas

| Area | Purpose |
|------|---------|
| `vasps` | VASP metadata and endpoint registry |
| `public_keys` | Ed25519 public key lifecycle |
| `transfers` | Travel Rule transfer metadata |
| `owner_checks` | OwnerCheck request metadata |
| `ttl_queue` | Delayed or pending transfer messages |
| `audit_log` | Operational and compliance evidence |

## Migration Checklist

- [ ] New Supabase project created or existing project selected
- [ ] `.env` populated with project keys
- [ ] `BONANZA_*` secrets configured
- [ ] Database migrations applied
- [ ] Seed data checked
- [ ] Edge Functions deployed
- [ ] Health check passed
- [ ] VASP public key lookup passed
- [ ] `transfer-auth` smoke request passed
- [ ] `owner-check` smoke request passed
- [ ] Documentation build passed

## Historical Note

The pre-redesign plan included multiple external provider adapters. The current target architecture is Bonanza Public Key Directory, CodeVASP-compatible relay, FI IDC channeling, OwnerCheck, and KYT Gate. External provider adapters are optional future rails, not core deployment requirements.
