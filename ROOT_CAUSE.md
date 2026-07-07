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

---

# Root cause 2 — prompt never fired despite real overrun (found after the fix above)

## Symptom

After unifying the lateness formula, E2E testing still produced late steps with no remarks:
execution 9005, step 6725/group 1960 — planned 120s, persisted duration 29,446s (~8.2h),
aggregated bucket contained only `{ stepCompleted: true }`. The prompt never appeared.

## Cause: two clocks, evaluated at different moments

The fix above unified the *formula* but not the *inputs*:

- **The prompt gate** ran once, at preview render, against *saved entry intervals* (sub-step
  `startTime`→`endTime` spans, or the backend rollup `duration` — which pre-completion only spans
  the recorded intervals). Time spent outside the entry form (sitting on the preview, waiting to
  approve) was on no clock. In the failing execution, data entry took seconds; the 8 hours accrued
  between entry and clicking Complete Step.
- **The persisted duration** is recomputed by the backend on the completion PUT with a
  `stepCompleted` end anchor (`addDurationsToStepStartEndTime`/`spanInfo`), i.e. wall clock. That
  is what the card and report read afterwards → late flag with no remarks, again.

## Fix: one clock, three checkpoints

`getLiveStepTimingStatus` (`timelineCardTiming.ts`): for an uncompleted step,
**actual = now − delay-clock start**, where the delay clock starts at the **previous timeline
step's completion** (`getStepClockStartIso`: previous step's `stepCompleted` timestamp; setup uses
its `endTime` — so the first template step is anchored to setup completion). Idle time between
steps counts against the new step. Fallback when the previous step's completion timestamp is
unavailable: the step's own first recorded start (`getStepStartTimeIso`: enriched `stepStartTime`
→ bucket `startTime` → earliest sub-step interval start). Planned resolution unchanged. Completed
steps keep `getStepTimingStatus` (stored duration).

Checkpoints in `execute-prc/index.tsx`:

1. **Preview render** — all four preview-creation sites and the refetch effect use
   `resolvePreviewTimingStatus` (live for uncompleted, stored for completed). A 1s ticker keeps
   re-evaluating while an uncompleted preview is open, so the prompt appears the moment planned
   time is exceeded.
2. **Approve clicks** — `applyTimingExceededMetadata` no longer trusts the render-time snapshot:
   `isPreviewStepLateNow()` recomputes wall-clock lateness at the moment of the click before
   deciding whether to stamp `timingExceeded` (+remarks/reason) into the bucket. Approvals are
   never blocked (StepPreview marks them optimistically before calling the parent — blocking would
   desync that local state); they stamp the flag, and the prompt then holds completion.
3. **Complete Step** — hard gate (`blockActionIfDelayUndocumented`): a step that is wall-clock
   late at the moment of the Complete click can never be completed without remarks + reason, even
   if lateness crossed planned time in the sub-second window between ticker runs and the click.
   The action is blocked and the required inputs are surfaced instead.

**Invariant**: a completed step that was late at completion always has remarks + reason persisted.
An incomplete late step re-prompts on every visit (wall clock keeps growing), so abandoning the
preview cannot dodge documentation either.

## Known residuals (accepted)

- If lateness crosses planned time in the ≤1s ticker window right before an *approval* click, the
  bucket is stamped `timingExceeded: true` without remarks on that PUT; remarks are then forced at
  Complete Step and land in the blob (what preview/PDF read). For **inspections** only, that late
  remarks delivery misses the relational `prc_execution_steps` row / `timing_delay_reasons` upsert,
  because the backend marks inspection rows `stepCompleted` at first approval and skips subsequent
  row updates — closing this fully needs a backend change (repo is reference-only).
- Backend-stored `duration` for inspections is the entry session only (`startTime`→`endTime`), so a
  completed inspection that was late from preview-wait shows the persisted-first delay section and
  remarks, but the sidebar card's computed flag may not light up. Cosmetic; the opposite polarity
  of the original bug (remarks are never hidden).
- Similarly, backend-stored `duration` never includes pre-step idle (previous step's completion →
  first entry), while the delay clock does. A step flagged late purely from inter-step idle shows
  its delay section + remarks after completion (persisted flag), but the stored actual-duration
  number on cards/reports is smaller than what the gate measured. Aligning the displayed duration
  with the delay clock would be a backend enrichment change (repo is reference-only).

## Data issues found alongside (not fixable in frontend)

- `inspection.inspection_timing` is NULL on all recent inspection masters → those inspections can
  never be late by design. Needs master data backfill.
- Recent `process_step_group.sequence_timing` values of 324,000–648,000s (90–180 hours) look like
  an HH:MM unit mix-up at master entry; such steps will effectively never prompt.
