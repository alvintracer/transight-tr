# GTR Adapter Implementation Guide

This document is archived.

The 2026-08 redesign removed GTR from the core data plane. TravelSafer now uses TravelSafer Public Key Directory and CodeVASP-compatible encrypted relay as the active route.

## Current Policy

| Adapter | Status |
|---------|--------|
| Bonanza relay | Active |
| CodeVASP-compatible route | Active |
| GTR | Disabled |
| Sumsub | Disabled |
| VerifyVASP | Disabled |

Future external rails require separate legal, privacy, SLA, and product approval.

Current source of truth:

- [TravelSafer API Specification](./ttr-api-specification.md)
- [External Adapters](/ko/api/gtr-adapter)
