# PRC report document Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the component-style PRC report with a boxed, GRN-style data document that renders the same on screen and on A4 paper.

**Architecture:**
- Pure mappers turn `ExecutionData` + timeline steps into a plain view model (formatted strings only).
- A handful of small components render that model as boxed HTML tables styled by one plain CSS file.
- Photos are rasterised to PNG with the existing `InspectionAnnotatedImageRaster`.
- Execution-screen components are untouched, except that two private helpers are moved out.

**Tech Stack:** React 19, TypeScript, Vite, vitest + happy-dom + Testing Library, react-konva (raster only).

**Spec:** `docs/superpowers/specs/2026-11-23-prc-report-document-design.md`

## Global Constraints

- **Lint:** `npm run lint` must pass with `--max-warnings 0`. Unused vars must be prefixed `_`.
- **No backend change:** no new API calls; only `useFetchPrcExecutionDetailsQuery` (plus image fetches through `useAuthenticatedFileUrl`).
- **Styling:** document CSS classes are prefixed `prc-doc-`. No MUI `sx` inside the document.
- **Sheet:** 794px wide on screen with 30px padding. `@page { size: A4 portrait; margin: 10mm 8mm 12mm; }`.
- **Type sizes:** 12px body, 11px table cells, 15px title. Sizes are the same on screen and print.
- **Empty value:** every empty value renders as `—`.
- **Status words:** `Completed`, `In progress`, `Pending`.
- **Not-started line:** "Not started — no data recorded".
- **Photos:** never split across pages. Max printed height is 120mm.
- **Commits:** follow the repo style `fix(prc-execution): …` / `feat(prc-execution): …`, with no AI attribution.

## Review Focus

- **Legacy index-keyed values** (`{ "0": {...} }`) for fixed-table, list and table data must render as rows, not "—". Covered by tests in Tasks 5 and 6.
- **Step with template metadata missing** (no `stepGroup`, no `prcTemplateStepId`) must still render a section with "Data not available for this step", not crash. Covered by a test in Task 7.
- **Images that fail to load** must show "Image could not be loaded: <file>", and the Print button must not wait forever. Covered by a test in Task 8.
- **Ok/not-ok "not applicable" with a comment, and `0` numeric values**: `0` must print as `0`, not blank. Covered by tests in Tasks 2 and 6.
- **Very long text** (remarks, comments, parameter names) must wrap inside its cell, never widen the table past the page. Handled by `table-layout: fixed` and `overflow-wrap: anywhere` in CSS, and checked manually in Task 9.

---

## View model (Task 3 defines it, every later task uses it)

`src/pages/prc-execution/components/report-prc-execution/document/types.ts`

```ts
export interface DocField { label: string; value: string; span?: number }
export interface DocColumn { key: string; label: string; align?: 'left' | 'right'; width?: string }
export type DocDetail =
  | { kind: 'table'; title?: string; table: DocTableModel }
  | { kind: 'photos'; photos: DocPhoto[]; defects?: string }
  | { kind: 'text'; text: string };
export interface DocRow { key: string; cells: Record<string, string>; strong?: string[]; details?: DocDetail[] }
export interface DocTableModel { columns: DocColumn[]; rows: DocRow[]; footer?: string }
export interface DocPhoto { key: string; caption: string; fileName: string; imageUrl: string; regions: AnnotationRegion[]; legend: string[] }
export type DocStatus = 'Completed' | 'In progress' | 'Pending';
export interface DocSectionModel {
  key: string; number: number; title: string; status: DocStatus; gate: boolean; partialGate: boolean;
  meta: DocField[]; approvals: DocField[]; notices: string[];
  hasData: boolean; unavailable?: string;
  tables: Array<{ title?: string; table: DocTableModel }>; notes: string[];
}
export interface DocHeaderModel { title: string; subtitle?: string; orderNo: string; date: string; fields: DocField[]; remarks: string }
```

---

### Task 1: Share `buildApproverRows` and `readStoredRowList`

**Files:**
- Create: `src/pages/prc-execution/utils/approverRows.ts`, with test `approverRows.test.ts`.
- Create: `src/pages/prc-execution/utils/storedRowList.ts`, with test `storedRowList.test.ts`.
- Modify: `StepExecutionMetaSummary.tsx:26-57` and `StepPreview.tsx:88-97`, to import them instead of defining them.

**Produces:**
- `buildApproverRows(meta: TimelineStepApprovalMeta, step: TimelineStep): ApproverRow[]`
- `type ApproverRow`
- `readStoredRowList<T>(value: unknown): T[]`

- [ ] Write the tests:
  - quality-only inspection → "Quality approved by";
  - sequence → "Production approved by";
  - `dataEnteredBy` without production → "Recorded by";
  - `readStoredRowList({ '0': a, '1': b })` → `[a, b]`; array passes through; non-object → `[]`.
- [ ] Run `npx vitest run src/pages/prc-execution/utils/approverRows.test.ts src/pages/prc-execution/utils/storedRowList.test.ts`. Expected: FAIL (module not found).
- [ ] Move the code verbatim and update both importers.
- [ ] Run the tests above, plus `npx vitest run src/pages/prc-execution`. Expected: same pass/fail set as before (the pre-existing failures are `mapExecutionToQrLabel` and 2× `datePickerConstraints`).
- [ ] Commit: `refactor(prc-execution): share approver rows and stored row list helpers`.

### Task 2: Formatters and result rules

**Files:**
- Create: `document/formatters.ts`, with test `document/formatters.test.ts`.

**Produces:**
- `dash(v: unknown): string` — returns `'—'` for null, undefined and `''`. `0` → `'0'`.
- `withUnit(v: unknown, unit?: string | null): string` — no unit when the unit is `'None'` or empty.
- `statusWord(s: TimelineStep['status']): DocStatus`
- `rangeResult(validationStatus?: string, acknowledged?: boolean): string` — maps Accepted/InRange → `OK`, Lesser → `Low`, Greater → `High`. Appends ` (ack.)` when out of range and acknowledged. Anything else → `—`.
- `okNotOkResult(v: unknown): string` — `OK` / `OK with deviation` / `Not applicable` / `—`.
- `exactResult(value: unknown, target: unknown): string` — `OK` or `Deviation ±<delta>`.
- `aggregateResult(results: string[]): string` — `Not OK` if any result is Low, High, Deviation, OK with deviation or Not OK. `OK` if any result is OK. Otherwise `—`.
- `readingsResult(results: string[]): string` — `OK`, or `Not OK (n of m)`.
- `isNotOk(result: string): boolean`

- [ ] Write the tests:
  - every row of the spec's "Result rules" table;
  - `dash(0) === '0'`;
  - `withUnit('12', 'None') === '12'`;
  - `withUnit('12', 'mm') === '12 mm'`.
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Commit: `feat(prc-execution): add report document formatters`.

### Task 3: View model, header and section shell mapping

**Files:**
- Create: `document/types.ts` (above).
- Create: `document/mapHeader.ts` and `document/mapSectionShell.ts`, with tests.

**Produces:**
- `mapHeader(execution: ExecutionData, step?: TimelineStep | null): DocHeaderModel`
  - Title is "Process Record Card". Subtitle is "Step N: <title>" for a single step.
  - Fields in spec order. Part description has `span: 2`. SAP Set ID reads `agg.prcmetadata.productionSetId`, falling back to `execution.productionSetId`. Status comes from `execution.status`.
- `mapSectionShell(step: TimelineStep, agg: Record<string, unknown>, tim: Record<string, unknown>): Omit<DocSectionModel, 'hasData' | 'tables' | 'notes' | 'unavailable'>`
  - `meta`: Start time (`formatDisplayDateTime`) and Planned duration, from `getStepTiming` / `getTimelineStepApprovalMeta`.
  - For sequence and inspection, `meta` also includes Actual duration when `actualSec` is set. Durations use `formatExecutionDuration` from `timelineCardTiming`.
  - `approvals`: from `buildApproverRows`, with values from `formatApproverDisplay`.
  - `notices`:
    - From `readPersistedDelayMetadata`: "Timing exceeded — reason: X, remarks: Y".
    - "Edited after submission on <formatDisplayDateTime>".

- [ ] Write the tests:
  - header fields and the SAP Set ID fallback;
  - single-step subtitle;
  - shell status words;
  - quality-only approval label;
  - timing notice text;
  - meta leaves out empty cells.
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Commit.

### Task 4: Raw materials and catalyst mixing mappers

**Files:**
- Create: `document/mapMaterials.ts`, with test.

**Produces:**
- `mapRawMaterials(step: TimelineStep): { tables; hasData }`
  - Columns as in the spec. Expiry goes through `formatDisplayDate`.
  - `hasData` is true when any item has an actual qty or batch.
- `mapBom(step: TimelineStep, agg: Record<string, unknown>): { tables; notes; hasData }`
  - Two tables, Mixing and Checks, grouped and ordered the way `BomStep` orders them: by material order, then split order.
  - The Order column appears only if any entry is split.
  - Recommended is `min.toFixed(2) – max.toFixed(2)` when both are above 0.
  - Range uses `rangeResult`.
  - FOD uses the `OK_NOT_OK_OPTIONS` label.
  - Operator is `"<name> (<code>), <ROLE>"`.
  - Captured at uses `formatDisplayDateTime`.
  - `notes` holds the one pot-life line.
  - `strong` includes `range` when the result is not OK.

- [ ] Write the tests, reusing the fixture from `BomStep.report.test.tsx`:
  - one row per entry;
  - split entries add the Order column;
  - Lesser → `Low` in bold;
  - empty can number → `—`.
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Commit.

### Task 5: Sequence mapper

**Files:**
- Create: `document/mapSequence.ts`, with test.

**Produces:**
- `mapSequence(step: TimelineStep, agg, tim): { tables; notes; hasData; unavailable? }`
- When the template metadata is missing, it returns `unavailable: 'Data not available for this step.'`.
- **Rows:** built from `buildSequenceDetailedMeasurements`, after skipping `editedAfterSubmit` and `editedAfterSubmitAt`. They are reordered by the index in `step.stepGroup.steps`, with unknown ids last.
- **Columns:** `no`, `parameter`, `criticality` (`formatSequenceCriticality`, with `—` for None), `value`, `target`, `method`, `result`, `time` (`formatCompactTimeRange`, primary + secondary on two lines).
- **Value:**
  - Arrays are joined with `, ` and the unit appears once.
  - ok/not ok shows its label, plus "Deviation no.: X" when a comment is present.
  - "Instrument: <id>" goes on a new line.
- **List and table values:** the value is "See below", with a `details` table.
  - List columns: Item | Value | Range | Result | Comment.
  - Fixed table: the configured columns, with cells via `resolveFixedTableCellSpec` + `formatTableCellDisplay`.
- **Second table:** "Responsible persons" (Parameter | Role | Name | Employee no.), only when anyone is listed.
- **notes:** "<parameter>: <notes>".

- [ ] Write the tests:
  - template order wins over key order;
  - the `editedAfterSubmit` key adds no row;
  - multiple readings → "12.1, 12.3 mm" and `Not OK (1 of 2)`;
  - exact target deviation;
  - a legacy index-keyed fixed table gives detail rows;
  - missing `stepGroup` → unavailable.
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Commit.

### Task 6: Inspection mapper

**Files:**
- Create: `document/mapInspection.ts`, with test.

**Produces:**
- `mapInspection(step: TimelineStep, agg): { tables; hasData; unavailable? }`
- **Data:** `normalizeInspectionStepAggregatedData(agg[tplStepId])`. Only numeric keys count as parameters, ordered by `sortByNumericOrder(step.inspectionParameters)` and then unknown ids.
- **Columns:** `no`, `parameter`, `gate` (`formatInspectionCriticality`), `value`, `result`, `instrument`.
- **Single values:**
  - datetime via `formatDisplayDateTime`, date via `formatDisplayDate`;
  - ok/not ok label plus deviation number;
  - numbers with `rangeResult`.
- **List, table, multi and fixed table:** "See below", with a details table. The result is the `aggregateResult` of entry and cell results; number cells use their `<col>_validationStatus`.
- **Photos:**
  - For each `annotations[i]`, a `DocPhoto` with:
    - `imageUrl` from `buildPreviewImageUrl(annotation, findMatchingPreviewFile(files, annotation))`;
    - caption "Photo <no>.<i+1> — <file>";
    - legend "<n>. <comment || '—'>" plus " (<category>)" when set.
  - Unannotated files from `getUnannotatedPreviewFiles` are added with an empty legend.
  - Fixed-table `rowAnnotations` go under their row as a photos detail on that sub-table row.
  - `defects` reads "Defects: A 2, B 1" from `defectCounts`.
- **Footer:** "Parameters N · Gate N · Not OK N · Photos N".

- [ ] Write the tests:
  - order by template;
  - metadata keys don't count;
  - `0` prints as `0`;
  - out-of-range number → `High` in bold;
  - a list with one "not ok" → `Not OK`;
  - legacy index-keyed fixed table rows;
  - photos with legend and defects;
  - footer counts;
  - quality-only labels are untouched (no regression).
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Commit.

### Task 7: Section dispatcher and document components + CSS

**Files:**
- Create: `document/mapSection.ts`, which dispatches by `step.type` and fills `hasData`. Setup's `hasData` = it has meta or approvals.
- Create: `document/ReportDocument.tsx`, `document/DocTable.tsx`, `document/DocFieldGrid.tsx`, `document/DocSection.tsx`, `document/DocHeader.tsx`, `document/reportDocument.css`.
- Test: `document/ReportDocument.test.tsx`.

**Produces:** `<ReportDocument execution={…} steps={TimelineStep[]} singleStep={TimelineStep | null} onPhotosSettled?={(pending: number) => void} />`

**Layout:**
- `DocTable` renders a `<table class="prc-doc-table">` with `<thead>`.
  - Each row's `details` become `<tr class="prc-doc-detail"><td colSpan={columns.length}>…</td></tr>`.
  - Cells listed in `strong` render in bold.
  - Multi-line values split on `\n` into `<div>`s.
- `DocSection`:
  - title bar with number, title, status and Gate;
  - meta strip;
  - when `!hasData`, a single row "Not started — no data recorded";
  - when `unavailable`, its text;
  - the tables, notes, notices and approvals row.
- **CSS:**
  - screen sheet;
  - `@media print` hides app chrome with `display: none` and resets the sheet;
  - `thead { display: table-header-group }`;
  - `tr, .prc-doc-photo { break-inside: avoid }`;
  - `.prc-doc-section-title { break-after: avoid }`;
  - `table-layout: fixed; overflow-wrap: anywhere`.
- The footer `@page` margin boxes are injected by `ReportDocument` as a `<style>` element. The order number is escaped: only `[A-Za-z0-9 ._/-]` is kept.

- [ ] Write the tests:
  - renders the header fields;
  - a pending step with no data shows the not-started line;
  - a missing-template sequence shows "Data not available for this step.";
  - a detail table renders under its row;
  - no `input` or `button` inside `.prc-doc-sheet`.
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Commit.

### Task 8: Photos and page wiring

**Files:**
- Create: `document/DocPhotoStrip.tsx`, with test.
- Modify: `InspectionAnnotatedImageRaster.tsx`, adding an `onError` callback if it lacks one.
- Modify: `report-prc-execution/index.tsx`, to render `ReportDocument` and keep the toolbar. The Print button reads "Preparing photos…" and is disabled while photos are still pending.
- Delete: `prcExecutionReportPrint.css`, plus any report-only imports in `index.tsx` that become unused.

**Photo strip:**
- A 3-column grid of `<figure class="prc-doc-photo">` elements, each holding the PNG `<img>` (`max-height: 120mm` in print), a caption and a legend.
- An image error shows "Image could not be loaded: <file>".
- Each photo reports `settled` once. The page counts outstanding photos.

- [ ] Write the tests: an error callback renders the failure text and reports settled; a success renders an `<img>` with the data URL (mock the raster).
- [ ] Run them and see them FAIL.
- [ ] Implement.
- [ ] Run them and see them PASS.
- [ ] Run `npx vitest run src/pages/prc-execution`, `npm run lint` and `npx tsc --noEmit`. Expected: no new failures or errors compared with before (tsc had 35 pre-existing errors).
- [ ] Commit.

### Task 9: Verify in the app

- [ ] Start the dev server against QA and open `/prc-execution/report/73658` plus one execution with photos and a fixed table.
- [ ] At a 733px sheet with the print rules applied, check:
  - no element extends past the sheet;
  - no table is wider than its parent;
  - photos are not split (inspect `break-inside`).
- [ ] Take a print preview / PDF and compare the page count with today's.
- [ ] Commit any fixes, push following the repo's push routine, and clean up.
