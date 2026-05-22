# Audit Note — AiResumeJobApplication

## Original audit recommendations (batch_07.md §17)

**Missing AI endpoints:** `/application-tracker`, `/rejection-analysis`, `/interview-scheduling-optimizer`, `/offer-negotiation-simulator`, `/career-trajectory-analyzer`.

**Missing non-AI features:** LinkedIn profile sync, application status tracking, interview feedback collection, offer comparison tool, background check status.

**Custom suggestions:** agentic application suite, interview coaching with recording, offer negotiation coach, career goal roadmap, company culture fit, recruiter relationship builder.

## Implemented this pass (3 mechanical)
1. `POST /api/ai/rejection-analysis` — structured analysis of likely rejection reasons + improvement plan + reapply recommendation.
2. `POST /api/ai/offer-negotiation-simulator` — coaches counter-offer + simulates recruiter reply + branching responses.
3. `POST /api/ai/career-trajectory-analyzer` — multi-path career projection with skill-gap closure plans, 1- and 3-year plans.

All three reuse `openRouterService.chat()` and `authenticateToken`, with a local JSON-parsing helper. Type-checked with `tsc --noEmit`.

## Backlog (prioritized)
1. `POST /api/ai/application-tracker` — application status persistence model already partly exists; needs CRUD wiring (mechanical).
2. `POST /api/ai/interview-scheduling-optimizer` — slot ranking endpoint (mechanical).
3. LinkedIn profile sync (NEEDS-CREDS — LinkedIn OAuth).
4. Background check status integration (NEEDS-CREDS).
5. Video interview feedback (NEEDS-PRODUCT-DECISION + STT/vision).

## Apply pass 3 (frontend)

**Action:** LEFT-AS-IS (FE already wired).

**Stack:** TypeScript Express backend + Vite/React (TSX) frontend with axios `api` client and JWT auth.

**Backend AI endpoints surfaced (pass 2):** `/ai/rejection-analysis`, `/ai/offer-negotiation-simulator`, `/ai/career-trajectory-analyzer` in `backend/src/routes/ai.ts`.

**Files:** `_AUDIT_NOTE.md` only (this section).

**Syntax check:** N/A.

**Notes:** `frontend/src/pages/AIRejectionAnalysis.tsx`, `AIOfferNegotiationSimulator.tsx`, and `AICareerTrajectoryAnalyzer.tsx` each call the matching pass-2 endpoint via the shared `api` axios client (Bearer token already attached). Routes registered in `App.tsx` at `/ai-rejection-analysis`, `/ai-offer-negotiation`, `/ai-career-trajectory`. Idempotence rule applied.

## Apply pass 6 (close-out)

**Items:**
1. `POST /api/ai/application-tracker` — application status helper.
2. `POST /api/ai/interview-scheduling-optimizer` — slot ranking endpoint.

**Action:** LEFT-AS-IS (both endpoints already implemented in a prior pass).

**Files:** `backend/src/routes/ai.ts` (existing; routes at lines 930 and 952), `_AUDIT_NOTE.md` (this section).

**Syntax check:** `node --check backend/src/routes/ai.ts` → PASS (exit 0).

**Duplicate-grep findings:**
- `/application-tracker` already defined at `ai.ts:930` — accepts `{ applications[], focusJobIds?, candidateProfile? }`, returns `{ tracker: { pipeline_summary, per_application[], priority_actions[], pipeline_recommendations[], summary } }`. Existing contract is a pipeline-level (multi-application) variant; backlog spec was single-application. House style (auth + openRouterService + tryParseJson + isMissingKeyError 503 branch) already matches.
- `/interview-scheduling-optimizer` already defined at `ai.ts:952` — accepts `{ candidateAvailability, recruiterAvailability, interviewType?, durationMinutes?, timezone?, priorities?, constraints? }`, returns `{ scheduling: { ranked_slots[], top_recommendation, conflicts[], suggestions_for_candidate[], message_to_recruiter, summary } }`. Equivalent semantics to backlog spec (ranked_slots + top_recommendation ≈ best_slot; conflicts captured; buffer expressible via constraints).

**Decision:** No re-implementation under append-only + no-duplicates rule; introducing a second handler at the same route would shadow or collide. Backlog items 1 and 2 are considered satisfied by the existing handlers.

**Remaining backlog:**
- NEEDS-CREDS: LinkedIn OAuth profile sync.
- NEEDS-CREDS: background check status integration.
- NEEDS-PRODUCT-DECISION: video interview feedback + STT/vision pipeline.
