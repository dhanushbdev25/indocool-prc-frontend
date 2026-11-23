# PRC report as a boxed data document (GRN style)

## Intent

The PRC report is what the plant prints or saves as PDF as the record of a production run. It lives at `/prc-execution/report/:id`, with `?step=N` for a single step.

Today it reuses the execution-screen components (cards, chips, accordions, interactive image canvases), so it reads like a screenshot of the app.

The user wants it to read like an SAP printout (GRN or invoice): a data-centric document of numbered sections and boxed tables, where every value has a label, a column or a row.

## Goals

- **One layout for screen and print.** The report page *is* the document: an A4-width white sheet on screen that prints the same way.
- **Boxed form style ("option A").** Every table cell is bordered, the header row is grey, text is black on white, and the type is dense.
- **One row per record.** One catalyst entry is one table row; one inspection parameter is one row.
- **Inline photos ("placement 1").** Photos sit directly under the inspection row they belong to, with numbered marks and a printed legend.
- **Page numbers.** "Page X of Y" in the page footer.
- **Show hidden data.** Data that is saved but hidden today is shown (see "Gaps fixed").

## Non-goals

- No backend change and no server-side PDF.
- The execution screens are not changed: `ExecutionSetupStep`, `BomStep`, `RawMaterialsStep`, `StepPreview`, `StepExecutionMetaSummary` and `SapConfirmationStep`.
  - Their report-only props become unused by the report: `embeddedReportMode`, `labelValueFields`, `hideLoggedInUser`, `hideHeading`, `expandAccordionsForPdf`.
  - Removing those props is a separate clean-up.
- No new data is captured. The document shows what is already persisted.

## Anti-goals

- Anything cut off at the left or right edge of the A4 page.
- Interactive controls (zoom, pan, fullscreen, expand) in the document.
- A value shown without its label or unit.
- Breaking the shop-floor execution screens.

## Constraints

- **Stack:** React 19, MUI 7, Vite, vitest with happy-dom. Lint runs with `--max-warnings 0`.
- **Page width:** A4 portrait with 8 mm side margins gives a printable width of about 730 px. The sheet on screen uses the same width, so screen and paper wrap the same.
- **Data shapes:** the persisted JSONB in `execution.prcAggregatedSteps` (agg) and `execution.stepStartEndTime` (tim).
  - See `docs/prc-execution-rendering-architecture-and-feature-guide.md` §5.5, §6.5, §12 and §13.
  - The guide's §12 is wrong about inspection `table` values. The code stores them as `value: rowObj[]`, and the code is right.
- **Images:** they are behind authentication (`useAuthenticatedFileUrl`).

## Approaches considered

### A. New document renderer (chosen)

- Pure mapping functions turn each step's saved data into plain rows. Small components draw them as boxed HTML tables.
- Photos are rasterised to a flat PNG by `InspectionAnnotatedImageRaster`, which already exists.
- The execution components stay untouched.
- It is the biggest of the three, about 1,000–1,500 lines with tests. It is also the only one that produces a true data document and cannot break the execution screens.

### B. Restyle the reused execution components with CSS (rejected)

- It is cheap, but the structure stays the screen's (entry blocks, accordions), so it doesn't read like a GRN.
- Every execution-screen change would leak into the report.

### C. Server-side PDF (rejected for now)

- It gives exact pagination.
- It needs a PDF engine, server image fetching and a new endpoint in the backend.
- The on-screen view would still need A.

## Design

### Files

New folder: `src/pages/prc-execution/components/report-prc-execution/document/`.

- **`mappers/`** holds pure functions, one per step type. Each returns a plain view model of strings that are already formatted, so they can be unit-tested without rendering.
  - `mapHeader(execution)` and `mapStepMeta(step, tim)`.
  - `mapSetup`, `mapRawMaterials`, `mapBom`, `mapSequence` and `mapInspection`.
  - `formatters.ts` covers dates, numbers with units, OK / Not OK labels and result derivation.
- **`components/`** holds the building blocks:
  - `DocTable`: boxed table with optional full-width detail rows.
  - `DocFieldGrid`: boxed label/value grid.
  - `DocSection`: numbered title, meta strip, body and approvals row.
  - `DocPhotoStrip`: inline photos with their legend.
  - `DocHeader`.
- **`reportDocument.css`** is plain CSS with the class prefix `prc-doc-`, used on screen and in print. There is no MUI `sx` inside the document.
- **`ReportDocument.tsx`** composes the header and sections.

`index.tsx` keeps loading, routing, the error states and the no-print toolbar (Back / Print), and renders `ReportDocument`.

Existing helpers are reused, not copied:

- Timeline and timing: `buildTimelineSteps`, `getStepTiming`, `getTimelineStepApprovalMeta`, `buildApproverRows`, `formatApproverDisplay`, `readPersistedDelayMetadata`.
- Step data: `buildSequenceDetailedMeasurements`, `normalizeInspectionStepAggregatedData`, `readStoredRowList`, `resolveFixedTableCellSpec`.
- Display formatting: `formatTableCellDisplay`, `formatOkNotOkValueForDisplay`, `parseOkNotOkValue`, `formatInspectionCriticality`, `formatSequenceCriticality`.
- Images: `findMatchingPreviewFile`, `buildPreviewImageUrl`, `getUnannotatedPreviewFiles`.
- Dates and durations: `formatDisplayDate`, `formatDisplayDateTime`, `formatExecutionDuration`.

Two of these are private today: `buildApproverRows` (in `StepExecutionMetaSummary.tsx`) and `readStoredRowList` (in `StepPreview.tsx`). They move into shared utils, with no change in behaviour, and the old files import them from there. This is the only change to those files. *(Builder's call, settled in review.)*

The old `prcExecutionReportPrint.css` is deleted. `ReportField.tsx` and `reportFieldUtils.ts` stay as long as `BomStep` and `ExecutionSetupStep` still import them.

### Page

- **Screen:**
  - grey page background;
  - the sheet centred, 794 px wide (A4 at 96 dpi), with 30 px padding;
  - white, with a thin shadow.
- **Print:**
  - the sheet fills the page with no shadow;
  - `@page { size: A4 portrait; margin: 10mm 8mm 12mm; }`.
- **Type:** 12 px body, 11 px table cells, 15 px document title, with Poppins inherited from the theme. Sizes are the same on screen and paper.
- **Footer:** uses `@page` margin boxes.
  - Bottom-left shows `PRC <order no.>`, injected as a small `<style>` with the order number escaped.
  - Bottom-right shows `Page X of Y`, using `counter(page)` and `counter(pages)`.
  - Chrome and Edge support this; other browsers just leave it out.
- **App shell:** the report route stays inside the current layout. Print CSS hides the drawer and top bar with `display: none`, not `visibility: hidden`, so they take no space and add no blank pages. The report flows normally rather than being positioned `absolute`, so that page breaks and repeated table headers work. If Chrome still adds a trailing blank page, the fallback is to move the route to a bare layout. *(Builder's call, settled in review.)*
- **Page breaks:**
  - Table header rows repeat on each page (native `thead`).
  - Rows and photo cells don't split across pages (`break-inside: avoid`).
  - A section title stays with the first rows of its table (`break-after: avoid`).

### Header (first page)

A boxed block with two rows:

1. **Title row:** three cells.
   - The Indocool logo (`assets/images/auth/Indocool-main-logo.png`).
   - The title "Process Record Card". In single-step mode: "Process Record Card — Step N: <title>".
   - Order no. and Date.
2. **Field grid:** 4 columns.
   - Fields: Part no., SAP no., Part description (2 columns wide), Drawing no., Customer, Variant, Mould, PRC Set ID, SAP Set ID, Reservation no. and Status.
   - Remarks spans all columns on the last line.

Below the block, one line of small text: "Physical signature is not required for Digital PRC; electronic approval shall serve as evidence of authorization."

Field sources are the same as today's header in `index.tsx`, with two additions:

- SAP Set ID moves here from the setup section. It reads `agg.prcmetadata.productionSetId`, falling back to `execution.productionSetId`.
- Status reads `execution.status`.

### Every section

- **Title bar** (grey, bordered): `<stepNumber>. <title>`.
  - On the right it shows the step status as a word: Completed, In progress or Pending (`step.status`, as computed today by `buildTimelineSteps`). *(Decided with the user.)*
  - It also shows "Gate" when `step.ctq` is set, and "Partial gate approval" when `partialCtqApprove` is set.
- **Steps with no saved data:** every step is printed. A step with nothing saved shows one boxed line, "Not started — no data recorded", instead of empty tables. *(Decided with the user.)*
- **Meta strip:** one boxed row containing only the cells that have a value.
  - Start time and Planned duration.
  - For sequence and inspection steps, also Actual duration when known.
- **Body tables:** see below.
- **Approvals row** at the end: boxed, one cell per approver from `buildApproverRows`, for example "Production approved by — S. Kumar (E123)". It is left out when there are no approvers.
- **Notices,** as boxed text rows where they apply:
  - "Timing exceeded — reason: …, remarks: …".
  - "Edited after submission on <date>". This is now printed too.

### Section bodies

#### Execution setup

- No body table, since SAP Set ID is in the header. The section shows only its meta strip and approvals.
- If it has neither, the section is left out.

#### Bill of material validation

- Source: `execution.rawMaterials`.
- Columns: No | Material | Description | Req. qty | UoM | Actual qty | UoM | Batch no. | Expiry.
- Expiry is formatted DD/MM/YYYY.
- The "PRC Set ID" column is dropped because it is always empty.

#### Catalyst mixing

- Source: `step.items` plus `agg.bom[itemId][order]`.
- Two tables, one row per entry, in the same row order: material order, then split order.

1. **Mixing:** Material | Description | Order (only if any entry is split) | Req. qty | Actual qty | Catalyst (ml) | Recommended (ml) | Range | Temp (°C) | RH (%).
   - Recommended is `calculatedMin – calculatedMax` to 2 decimal places when both are above 0, otherwise "—".
   - Range is the persisted `validationStatus`: Accepted, Lesser or Greater.
2. **Checks:** Material | Can no. | Hygrometer | Weighing m/c | FOD | Deviation / comment | Operator (name, number, level) | Captured at.

The pot-life rule is printed once under the tables as a note, not repeated for each entry.

#### Sequence (process) steps

Table columns: No | Parameter | Criticality | Value | Target | Method | Result | Start – End.

- **Row order:** template step order (`step.stepGroup.steps`), with unknown ids last. `editedAfterSubmit*` keys are skipped.
- **Value:** formatted with its unit.
  - Multiple readings (`multipleMeasurements`) print in one cell, comma-separated with the unit once: "12.1, 12.3, 12.4 mm". *(Builder's call, settled in review.)*
  - "Instrument: <id>" appears on a second line when present.
  - ok / not ok shows its label plus "Deviation no.: …".
- **Result:** see "Result rules".
- **List and fixed-table values:** the Value cell says "See below", and a full-width detail row underneath holds the sub-table.
  - List columns: Item | Value | Range | Result | Comment.
  - Fixed table: the configured columns.
- **Under the table:**
  - "Notes": one line for each parameter that has notes.
  - A "Responsible persons" table: Parameter | Role | Name | Employee no.

#### Inspection steps

Table columns: No | Parameter | Gate | Value | Result | Instrument.

- **Row order:** template parameter order, as today.
- **Value for single parameters:** formatted. Date-times are formatted; ok / not ok shows its label plus the deviation number.
- **Value for list, table, fixed table and multi parameters:** "See below", with a full-width detail row holding the sub-table.
  - List: Item | Value | Range | Result | Comment.
  - Table: the configured columns, one row per saved row.
  - Multi: the configured columns, one row.
  - Fixed table: the configured columns. Per-row photos go in an extra detail row under that table row.
- **Photos (placement 1):** a full-width detail row under the parameter, or under the fixed-table row.
  - Up to 3 photos per line, each a flat PNG with numbered marks.
  - Caption: "Photo <param no>.<n> — <file name>".
  - A legend lists each mark with its number, comment and category.
  - Unannotated reference files print without a legend.
  - If an image fails to load, the cell says "Image could not be loaded: <file name>" instead of leaving a gap.
  - **A photo is never split across two pages.** *(Decided with the user.)*
    - Each photo is printed as one unit with its caption and legend (`break-inside: avoid` on the photo block). The detail row holding the photos may break between photo lines, but never inside one.
    - Photo height is capped (max 120 mm when printed), so any single photo, with its caption, always fits on one page. Wider-than-tall photos are unaffected in practice.
- **Defect counts:** when `defectCounts` is present, it prints as a line under the photos, for example "Defects: Pin hole 2, Dry patch 1".
- **Totals row** at the end of the table: "Parameters N · Gate N · Not OK N · Photos N". The counts come from real parameter rows only.

#### SAP confirmations

Not printed, as today: the full report leaves the step out, and `?step=N` on the SAP step keeps its existing error message. No SAP mapper or table is built.

### Result rules

| Data | Result shown |
|---|---|
| Number with `validationStatus` Accepted or InRange | "OK" |
| Number with `validationStatus` Lesser | "Low" |
| Number with `validationStatus` Greater | "High" |
| Out of range and acknowledged | The result above plus " (ack.)" |
| Exact-value target that matches | "OK" |
| Exact-value target that doesn't match | "Deviation ±delta" |
| ok / not ok | "OK", "OK with deviation" or "Not applicable" |
| List, table, fixed table or multi with any entry or cell out of range or "not ok" | "Not OK" |
| List, table, fixed table or multi with something recorded and nothing out of range | "OK" |
| Several readings (sequence `multipleMeasurements`) | "OK" if every reading is OK; otherwise "Not OK (2 of 3)", counting the readings that are Low, High or a deviation |
| Nothing recorded, or no rule applies | "—" |

Results other than OK print in bold, so they stand out in black and white.

### Images

- Photos are rasterised with `InspectionAnnotatedImageRaster`, which exists but is unused today.
  - It loads the image through `useAuthenticatedFileUrl`.
  - It draws the marks off-screen with Konva and returns a PNG data URL.
- The PNG is rendered as an `<img>` at 100% of its cell width.
- The Print button waits until every photo has finished or failed before calling `window.print()`. Until then it shows "Preparing photos…".

## Gaps fixed on the way

- Inspection Result now comes from the saved range and ok/not-ok data. It used to be a green tick regardless.
- Instrument IDs and defect counts are shown. They were saved but never displayed.
- Date-time values are formatted. They used to print raw.
- Parameter counts no longer include internal keys.
- The raw materials "PRC Set ID" column, which was always empty, is dropped.
- Sequence rows follow template order, and `editedAfterSubmit` keys no longer produce bogus rows.
- "Edited after submission" is printed. It used to be hidden in print.

## Tests

- **Mapper unit tests per step type,** using realistic agg fixtures that cover:
  - legacy index-keyed objects;
  - split BOM entries;
  - out-of-range values;
  - "not applicable" and "not ok" with comments;
  - missing data.
- **Component tests:** the document renders the header fields, one row per catalyst entry, sub-tables as detail rows, photos as `<img>`, and no inputs or buttons inside the document.
- **Manual check:** photos never split across a page break (check in print preview with a step that has several photos).
- **Manual check:** execution 73658, plus one execution with photos and a fixed table, on screen and in print preview.
  - Nothing goes beyond the page edges.
  - The page footer is present.
  - The page count is compared with today's.

## Left to the builder

- Exact column widths, and which columns may wrap.
- How `DocTable` takes detail rows (the shape of its props).
- What to show when a step's template metadata is missing. Today the section says "Data not available for this step"; keeping that is the default.
