# Root cause — delay remarks missing from PRC preview / PDF

## Symptom

When a step's actual duration exceeded its planned duration, the step card showed the yellow late
flag, and the operator was prompted for (and entered) delay reason + remarks. The remarks were
saved, but the PRC preview and the printed PDF did not show them.

## Which link broke

**Retrieval/render gate — not persistence.** The remarks were prompted, submitted, persisted, and
fetched correctly:

- Written to `prcAggregatedSteps[prcTemplateStepId][stepGroupId]` (sequence) /
  `prcAggregatedSteps[prcTemplateStepId]` (inspection) together with `timingExceeded: true`
  (`applyTimingExceededMetadata` in `src/pages/prc-execution/components/execute-prc/index.tsx`).
- Returned intact by `GET /prcExecution/{id}` (no validator strips them) and extracted by the
  report builders in `src/pages/prc-execution/utils/reportStepPreviewData.ts`.

The break: `StepPreview.tsx` rendered the whole delay section behind
`if (!previewData.timingExceeded) return null;`, and in the report path `timingExceeded` was
**recomputed live** by two strict functions (`calculateSequenceStepGroupTiming` /
`calculateInspectionStepTiming`, formerly `timelineCardTiming.ts:83-147`). The persisted
`timingExceeded: true` flag sitting next to the remarks was never consulted. Meanwhile the card's
yellow flag used a third, more lenient computation (`getTimelineStepPlannedVsActual`, formerly
`timelineCardTiming.ts:261-305`).

Three lateness derivations existed and disagreed:

| | Card flag (lenient) | Remarks gate (strict) |
|---|---|---|
| Planned source | bucket `plannedTime` → master fallback | master timing only; 0/missing ⇒ never late |
| Actual (sequence) | rollup `duration` → summed sub-step intervals | summed sub-step intervals only |
| Actual (inspection) | `duration` → delta(start,end) → nested leaf sum | `duration` → delta(start,end) only |
| Persisted `timingExceeded` | ignored | ignored |

Any divergence produced the symptom (flag late, remarks hidden). Reproduced deterministically in
`src/pages/prc-execution/utils/stepLateness.test.ts` for the two most common modes:

1. **Inspection master without `inspectionTiming`** (the field is recent; older masters lack it):
   the strict gate treated `expectedDuration = 0` as "never late" even when the timing bucket held
   a `plannedTime` captured at execution time.
2. **Sequence bucket with a rollup `duration` but no per-sub-step intervals**: the strict gate
   summed zero intervals and returned not-late; the card used the rollup.

Also possible: sub-step ids drifted from the current master, or master timing edited after
execution.

## Fix

Single authoritative computation in `src/pages/prc-execution/utils/timelineCardTiming.ts`:

- `getStepTiming(step, stepStartEndTime)` — planned/actual seconds with the full fallback chain
  (the former lenient card computation, renamed).
- `isStepLate(timing)` — the one lateness predicate, used by the card flag
  (`StepExecutionMetaSummary`), the live remarks prompt (`execute-prc/index.tsx`), and the report
  builders (`reportStepPreviewData.ts`) via `getStepTimingStatus`. The two strict functions were
  deleted.
- `readPersistedDelayMetadata(step, aggregated)` — one reader for saved delay documentation,
  replacing eight copy-pasted extraction blocks.

Display gate in `StepPreview.tsx` is now **persisted-first**: in browse/report mode (or on a
completed step) the delay section renders whenever the saved bucket has `timingExceeded === true`
or non-empty remarks/reason — regardless of what a fresh recompute says. The live actual-vs-planned
delta is only shown when the live computation itself says late. The *prompt* (required reason +
remarks before any approval) remains driven purely by live `isStepLate`.

## Planned vs expected semantics (settled)

They were the same value under two names. "Expected" (`StepPreviewData.expectedDuration`) was just
the planned duration. Renamed to `plannedDuration` throughout the frontend (nothing persisted used
the old name). Definition: **bucket `plannedTime` (captured at execution time), falling back to the
master timing (`stepGroup.sequenceTiming` / `inspectionMetadata.inspectionTiming`), in seconds.**
The lateness comparison uses exactly this value. Durations are held in seconds internally and
converted only at the display boundary (`formatExecutionDuration`).

## Steps with no planned timing

Explicit behavior (previously it fell out of implementation details, inconsistently): a step with
no positive planned duration is **never late and never prompts for remarks** (`isStepLate` requires
`plannedSec > 0`). Saved remarks on such a step (legacy data) still display. Note this deliberately
changes one corner: cards no longer flag steps whose planned time is `0`.

## Edited-after-submission indicator (added during this change)

When a submitted step (`stepCompleted: true`) is persisted again (admin edit), the step's
aggregated bucket is stamped with `editedAfterSubmit` / `editedAfterSubmitAt` / `editedAfterSubmitBy`
(`stampEditedAfterSubmit` in `execute-prc/index.tsx`). The preview shows an "Edited after
submission" chip; the printed PDF hides it (`prc-report-no-print`). The flag is written the same
way as the remarks fields (schemaless `prcAggregatedSteps` blob) — no backend change. It only marks
edits made after this change ships; there is no retroactive detection.

## Compatibility

No master schemas or persisted records were modified. New writes use the same aggregated-bucket
fields as before. Legacy PRCs whose remarks were hidden by the old gate now display them; in-flight
PRCs are unaffected.
