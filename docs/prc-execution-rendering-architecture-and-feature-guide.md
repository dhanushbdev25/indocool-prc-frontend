# PRC Execution Rendering Architecture and Feature Guide

## Document Purpose

This document provides a technical and functional explanation of how PRC execution is rendered in the frontend, with special focus on:

- `sequence` execution steps
- `inspection` execution steps
- part-driven execution sections (`rawMaterials` and `bom`)
- option-type behavior (`table`, `text`, `number`, `datetime`, `ok/not ok`)

It is intended for developers, QA engineers, and product stakeholders who need to understand how data is transformed from API payloads into runtime UI and persisted back to the backend.

## Why This Is Called a "Deep Dive"

This document is intentionally named **Deep Dive** because it covers more than feature summaries. It includes:

- architecture-level flow from route and API to UI and persistence
- data model and payload-shape behavior
- conditional rendering logic by parameter/target type
- validation and approval lifecycle details
- compatibility handling for legacy data structures

In short, it explains both **what** the feature does and **how** it is implemented end-to-end.

---

## 1. Runtime Entry and Screen Orchestration

### Entry Points

- Route: `src/routes/screenList.ts` (`prc-execution/execute/:id`)
- Main orchestrator: `src/pages/prc-execution/components/execute-prc/index.tsx` (`ExecutePrc`)
- API layer: `src/store/api/business/prc-execution/prc-execution.api.ts`

### Core Runtime Operations

The screen performs four primary operations:

1. Fetch execution details from `/prcExecution/:id`
2. Build a timeline model for UI rendering
3. Collect and validate step-level user input
4. Persist progress and approval state through update APIs

Primary persisted fields:

- `prcAggregatedSteps`: step values, status flags, and approval state
- `stepStartEndTime`: start/end times and approval/completion timestamps

---

## 2. Core Data Contracts

Type definitions: `src/pages/prc-execution/types/execution.types.ts`

### Key Interfaces

- `ExecutionData`: source payload for execution runtime
- `TimelineStep`: normalized UI step object (`setup | rawMaterials | bom | sequence | inspection`)
- `StepGroup`: sequence group model containing nested process steps
- `inspectionParameters` and `inspectionMetadata`: inspection schema and metadata for rendering/approval

These contracts allow a single execution screen to support heterogeneous step types with a unified timeline and save mechanism.

---

## 3. Timeline Construction and Status Logic

Builder: `src/pages/prc-execution/utils/buildTimelineSteps.ts`

### Timeline Build Sequence

`buildTimelineSteps(executionData)` creates cards in this order:

1. `setup`
2. `rawMaterials` (if present)
3. `bom` rendered as **Catalyst Mixing** (if present)
4. template-driven dynamic steps:
   - `sequence`: one card per step group
   - `inspection`: one card with all inspection parameters

### Status Derivation

Status is computed from aggregated state:

- `completed`: data + required approvals + completion action present
- `in-progress`: partially done or approval-ready
- `pending`: not yet started

Helper checks:

- `isSequenceStepGroupCompleted`
- `isSequenceStepGroupReadyForCompletion`
- `isInspectionStepCompleted`
- `isInspectionStepReadyForCompletion`

---

## 4. Rendering Dispatch by Step Type

Dispatcher: `src/pages/prc-execution/components/execute-prc/components/StepDetailView.tsx`

### Component Routing

- `setup` -> `ExecutionSetupStep`
- `rawMaterials` -> `RawMaterialsStep`
- `bom` -> `BomStep`
- `sequence` -> `SequenceStep` (sub-step aware)
- `inspection` -> `InspectionStep`

Preview/report + approval UI:

- `src/pages/prc-execution/components/execute-prc/components/StepPreview.tsx`

---

## 5. Sequence Feature Behavior

Implementation: `src/pages/prc-execution/components/execute-prc/components/steps/SequenceStep.tsx`

### 5.1 Supported Target Value Types

- `ok/not ok`
  - radio selection (`ok` / `not ok`)
  - mandatory comment when `not ok` is selected
- `range`
  - numeric input within configured limits
- `exact value`
  - numeric input (configured as exact-match style in sequence definition)

### 5.2 Multi-Measurement Capability

When enabled (`multipleMeasurements = true`):

- users can add/remove measurement entries
- total entries are constrained by `multipleMeasurementMaxCount`

### 5.3 Acceptance-Range Intelligence

For measurement-range steps:

- runtime computes `Accepted`, `Lesser`, or `Greater`
- out-of-acceptance values trigger acknowledgment requirement
- submission is blocked until acknowledgment is provided

### 5.4 Responsible Person Capture

When `responsiblePerson` is enabled:

- one or many responsible persons can be captured
- each record includes role (`l1`-`l4`), employee name, employee code

### 5.5 Sequence Persistence Shape

Saved hierarchy:

`prcTemplateStepId -> stepGroupId -> stepId`

Step payload supports:

- scalar values
- arrays for multiple measurements
- object values for `ok/not ok` (`{ value, comments }`)
- optional acceptance metadata (`validationStatus`, acceptance bounds)

---

## 6. Inspection Feature Behavior

Implementation: `src/pages/prc-execution/components/execute-prc/components/steps/InspectionStep.tsx`

Inspection is parameter-driven and supports multiple rendering modes per parameter definition.

### 6.1 Table Parameter Mode

Condition: `param.type === 'table'` and `columns.length > 0`

Features:

- dynamic row management (add/remove)
- per-cell validation by column type
- `ok/not ok` cell handling with required comments
- `datetime` support at cell level

### 6.2 Multi-Column Non-Table Mode

Condition: parameter has columns but is not table-type.

Features:

- field-per-column input rendering
- value persisted as structured object under `value`
- supports typed column validation including `ok/not ok` comments

### 6.3 Single-Value Parameter Mode

Condition: no columns defined.

Type-driven controls:

- `text` -> text field
- `number` -> numeric field
- `datetime` -> date/time picker
- `ok/not ok` -> radio + mandatory comment when not-ok

### 6.4 Image Annotation Support

- image attachments can be annotated using `ImageAnnotator`
- annotations are persisted per parameter
- preview renders annotation overlays through `ImageDisplay`

### 6.5 Inspection Persistence Shape

Submission is normalized by parameter:

- table -> `{ value: [ { colA: ..., colB: ... }, ... ] }`
- multi-column -> `{ value: { colA: ..., colB: ... } }`
- single -> `{ value: ... }`
- not-ok comments -> `comments` (legacy `notOkComment` supported on reads)
- image annotations -> `annotations: []`

---

## 7. Parts Usage in Execution Runtime

In execution context, parts are consumed as runtime-resolved material arrays:

- `rawMaterials` -> validation workflow in `RawMaterialsStep`
- `bom` -> catalyst mixing workflow in `BomStep`

This is important: execution rendering uses runtime material snapshots, not live master lookups during step entry.

---

## 8. Save, Merge, Approval, and Completion Lifecycle

Orchestrator: `src/pages/prc-execution/components/execute-prc/index.tsx`  
Builders: `src/pages/prc-execution/utils/dataBuilders.ts`

### 8.1 Step Data Submission

On submit:

1. Build step-specific aggregated payload (`buildAggregatedData`)
2. Build timing payload (`buildTimingData`) if absent
3. Merge into current state (`mergeAggregatedData`, `mergeTimingData`)
4. Attach actor metadata (`buildUserApprovalData`, `mergeUserApprovalData`)
5. Persist with `updatePrcExecutionProgress`

### 8.2 Approval Actions

In preview:

- Production approval -> `productionApproved`
- CTQ full approval -> `ctqApproved`
- CTQ partial approval -> `partialCtqApprove`

Each approval also writes:

- action timestamp (`buildApprovalActionTimingData`)
- approving user id (`buildUserApprovalData`)

### 8.3 Step Completion

On final completion action:

- sets `stepCompleted`
- writes completion timestamp and user id
- for sequence groups, can store timing-exceeded remarks
- refreshes/rebuilds timeline representation

---

## 9. Preview and Reporting Behavior

Implementation: `src/pages/prc-execution/components/execute-prc/components/StepPreview.tsx`

### Sequence Preview

- renders measurement report table
- shows value, type, method, acceptance range, and validation status
- includes not-ok comments and responsible person data where available

### Inspection Preview

- single-value parameters shown directly
- multi-column and table parameters shown in expandable views
- `ok/not ok` values normalized for readability (`OK` / `Not OK`)
- comments and annotations displayed with parameter context

### Approval Access Rules

Approval controls are role-aware and inspection-metadata-aware:

- production access can depend on `approveByProduction`
- quality access can depend on `approveByQuality`

---

## 10. Configuration Sources in Master Modules

### Sequence Master

- `src/pages/masters/sequence-master/components/create-sequence/types.ts`
- `src/pages/masters/sequence-master/components/create-sequence/schemas.ts`

Configured target value types:

- `range`
- `exact value`
- `ok/not ok`

### Inspection Master

- `src/pages/masters/inspection-master/components/create-inspection/schemas.ts`

Configured parameter/column types include:

- `text`
- `number`
- `boolean`
- `ok/not ok`
- `datetime`
- `table`

---

## 11. Data Compatibility and Naming Consistency

- Runtime naming remains consistent with `execution`, `sequence`, and `inspection`
- Comment compatibility supports both `comments` and historical `notOkComment`
- Data transformation paths include normalization for older annotation object structures

---

## 12. Executive Summary

The PRC execution module uses a single orchestrated runtime flow that:

1. loads execution state
2. builds a typed timeline
3. renders step UIs according to parameter configuration
4. validates and normalizes user input
5. applies role-based approvals
6. persists auditable progress and timing data

This architecture allows flexible, schema-driven execution behavior while maintaining controlled approvals, traceability, and compatibility with legacy records.

