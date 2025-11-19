# Problem and Goals
Build a production-ready React Native (Expo) app (`halteres-mobile`) that leverages the existing Halteres Next.js app (`halteres.ai`) and Supabase backend to deliver the core coach workflow:
1) sign in / sign up, 2) dashboard with programs, 3) create and manage clients, 4) program builder to generate programs, 5) view programs and enhance workouts.
Program wizard flows in `/program-wizard` are being deprecated and must NOT be ported.

## Current Architecture Overview
### Web (halteres.ai)
- **Auth & data**: Supabase for email/password and Google OAuth, plus profiles, entities (clients/classes), programs and program_workouts tables via `AuthContext`, `useDashboardData`, `useProgramData`, `useProgramWorkouts`.
- **Dashboard**: `app/dashboard/page.js` → `Dashboard.jsx` pulls entities and programs for the current user and computes workout stats from `program_workouts`.
- **Clients**: `/dashboard/manage/entities` uses Supabase directly for querying `entities` and server actions in `app/actions/entityActions.js` for create/update/delete.
- **Program creation**: dashboard modals ultimately hit `/api/CreateProgram` (mobile-compatible Supabase server client with bearer tokens and CORS) to insert a program row with calendar, gym, and format metadata.
- **Program builder**: `/program/[programId]/writer` wraps `AIProgramWriter` in `ProgramProvider`, which:
  - Reads program via `useProgramData` and workouts via `useProgramWorkouts` (Supabase real-time hooks).
  - Uses `programActions.generateProgram` to stream AI-generated workouts from `/api/generate-program-anthropic` (SSE, mobile-compatible) and stores them back into `program_workouts` and `programs.generated_program`.
- **Program views**: `/program/[programId]/calendar`, `/workouts`, `/workout/[workoutId]` render calendar and workout lists using Supabase data.
- **Workout enhancement & suggestions**:
  - `/api/enhance-workout`: OpenAI-powered enhancement of a single workout.
  - `/api/enhance-program`: OpenAI-powered enhancement of a whole program.
  - `/api/search-workouts-new`, `/api/ai-workout-suggestions`, `/api/add-workout-to-program` support searching and storing workouts.
- **Public sharing**: `/api/public-program` and `/api/public-workout` return read-only program/workout views by programId/workoutId.

### Mobile (halteres-mobile)
- **Stack**: Expo + Expo Router, React Native Paper, React Query, Zod, Supabase client (`lib/supabase/client.ts`) using SecureStore/AsyncStorage; `AuthProvider` mirrors web AuthContext at a basic level (user/session, email+password auth, sign-out).
- **Routing**:
  - Root `_layout` wraps app in `PaperProvider`, `QueryProvider`, `AuthProvider`.
  - `app/index.tsx` redirects to `/(app)/dashboard` if authenticated, or `/(auth)/login` otherwise.
  - `(auth)` stack: `login.tsx` uses a React Native Paper card with tabbed `LoginForm`/`SignupForm`; `reset.tsx` placeholder; `signup.tsx` older, tailwind-style screen not wired to the new forms.
  - `(app)` tabs: `dashboard`, `programs`, `settings`.
- **Auth UI**:
  - `LoginForm` and `SignupForm` already use React Native Paper, Zod, and `useAuth` to call Supabase email/password sign-in and sign-up.
  - No mobile Google OAuth or password reset flow yet; sign-up does not configure `emailRedirectTo`.
- **API access**:
  - `lib/api/client.ts` defines `ApiClient` that uses the Supabase session access token in an `Authorization: Bearer <token>` header to call `EXPO_PUBLIC_API_URL` (default `https://halteres.ai`). This matches `/app/utils/supabase/mobile.js` which builds a Supabase server client from bearer tokens.
- **Domain hooks**:
  - `usePrograms` / `useClients` expect REST endpoints (`/api/programs`, `/api/clients`, etc.) that are **not yet implemented** in the Next.js app; types expect derived fields like `client_name`, `program_count`, `workout_count`.
  - `useCreateProgram` currently POSTs to `/api/programs` and is wired to `CreateProgramScreen` (simple name/description/duration form, no AI generation).
- **Screens**:
  - `DashboardScreen` shows quick actions, overview cards, recent programs/clients, and an `AddClientModal` that calls `useCreateClient`. Data will fail until program/client APIs exist or hooks are re-pointed to Supabase.
  - `ProgramsScreen` lists programs via `usePrograms` and navigates to `programs/create` or `programs/[id]`.
  - `CreateProgramScreen` creates a lightweight program (no calendar/gym metadata and no AI generation) via `useCreateProgram`.
  - `ProgramDetailScreen` (`programs/[id].tsx`) is currently a placeholder.

## Target Mobile Experience
- **Auth**: Email/password sign-in and sign-up using Supabase, with clear errors and loading states; optional in-app "forgot password" that triggers Supabase email reset (redirects through `halteres.ai/auth/callback?reset=true`).
- **Dashboard**: After login, a coach sees:
  - Totals: number of programs, active clients, and basic workout stats (today/this week) derived from `program_workouts`.
  - Recent programs (name, duration, client, workout count) and recent clients (with program counts), matching the web dashboard at a high level.
- **Clients**:
  - Create clients with name/email/notes.
  - List and filter clients; view client detail including basic info and associated program count.
  - Edit client info and delete/soft-delete clients.
- **Programs**:
  - List programs with key metadata (name, duration, linked client/entity, workout count, created_at).
  - Create a program for a selected client and basic scheduling preferences (duration, days/week, start date) without using the deprecated `program-wizard` pages.
- **Program builder (AI)**:
  - For a given program, configure training methodology, focus, equipment, reference input/personalization and schedule.
  - Trigger AI generation via the existing SSE endpoint (`/api/generate-program-anthropic`) and show streaming status/progress.
  - Persist generated workouts into Supabase `program_workouts` and update the program overview, reusing the same server behavior as the web app.
- **Program viewing & workout enhancement**:
  - Program detail view: high-level summary (goal, difficulty, duration, schedule) and list of workouts grouped by week/date.
  - For each workout: view full markdown/text, mark completion, optionally reschedule.
  - Enhance a workout by posting it plus user instructions to `/api/enhance-workout` and replacing/updating the stored workout.

## High-Level Approach
- **Reuse Supabase-first model for core data**: On mobile, mirror the web hooks (`useDashboardData`, `useProgramData`, `useProgramWorkouts`) with Expo-friendly Supabase client instead of building a parallel REST data model for everything.
- **Use halteres.ai API only where necessary**: Keep heavy/secure operations (program creation with full metadata, AI generation, workout enhancement, AI suggestions, billing) behind the existing Next.js API routes that already support bearer tokens via `createMobileCompatibleClient`.
- **React Native Paper as primary UI toolkit**: New screens and forms use React Native Paper (Cards, Buttons, TextInputs, SegmentedButtons, etc.). Gradually remove reliance on Tailwind-style `className` styling where nativewind is not working, starting with auth and new program/clients/program-builder screens.
- **Preserve business rules and schema**: Follow the existing database schema and logic documented in `useProgramData`, `useProgramWorkouts`, and AI program writer code, instead of re-inventing program semantics.

## Implementation Plan
### 1. Authentication & Routing
- Confirm Supabase env wiring in Expo (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) and that `AuthProvider` correctly persists sessions and exposes `user`, `session`, `signIn`, `signUp`, `signOut`.
- Finish consolidating auth UI:
  - Update `(auth)/signup.tsx` to use the existing `SignupForm` with React Native Paper instead of the tailwind-based placeholder.
  - Add a simple "Forgot password" flow in `LoginForm` or `login.tsx` that calls `supabase.auth.resetPasswordForEmail` with `redirectTo` pointing at the existing web callback/reset flow (`https://halteres.ai/auth/callback?reset=true`).
- Ensure navigation guards rely only on `useAuth` (as `app/index.tsx` already does) so that unauthenticated users are always sent to `(auth)` and authenticated users to `(app)` tabs.

### 2. Core Data Access Strategy
- For **clients, programs, workouts, stats**, implement mobile hooks that talk directly to Supabase using `lib/supabase/client.ts`, mirroring web behavior:
  - New hooks in `halteres-mobile`:
    - `useDashboardDataMobile` that re-implements the logic from `halteres.ai/app/hooks/useDashboardData.js` (entities, programs, and workout stats) against the mobile Supabase client.
    - `useProgramDataMobile(programId)` matching `useProgramData` behavior for fetching/updating a single program.
    - `useProgramWorkoutsMobile(programId)` mirroring `useProgramWorkouts` for listing/updating/adding/deleting program workouts.
- Restrict `ApiClient` usage to endpoints that the web already routes through `/app/api` (CreateProgram, generate-program-anthropic, enhance-workout, search-workouts-new, add-workout-to-program, etc.), using bearer token auth.
- Decide whether any **new REST endpoints** are required on `halteres.ai` for mobile-only convenience (e.g., `/api/dashboard/summary`). Where the web already does the work fully in Supabase, prefer direct Supabase access over new APIs to keep behavior consistent.

### 3. Dashboard Parity on Mobile
- Replace `DashboardScreen`’s `usePrograms`/`useClients` calls with `useDashboardDataMobile` so it receives:
  - `programs`, `entities` (clients/classes) and `stats` (totalPrograms, activeWorkouts, upcomingWorkouts) just like the web.
- Map the web dashboard UX to mobile:
  - Quick actions: "Create Program" navigates to `/(app)/programs/create`; "Add Client" opens `AddClientModal`.
  - Overview cards show total programs, today’s workouts, this week’s workouts, and active clients using `stats` and `entities`.
  - Recent programs/clients sections show the latest 3 items each; hook into navigation so taps go to program detail and client detail screens.
- Ensure pull-to-refresh on the dashboard uses a `refetch` function from `useDashboardDataMobile` to reload entities, programs, and stats in one shot.

### 4. Client Management (Create and Manage Clients)
- On **mobile hooks**:
  - Rework `useClients` and `useCreateClient`/`useUpdateClient`/`useDeleteClient` to use Supabase directly against the `entities` table with `type = 'CLIENT'`, mirroring the logic from `entityActions.js` but on the client:
    - `useClients`: select basic fields plus optional `program_count` via an aggregate or a separate Supabase query on `programs`.
    - `useCreateClient`: insert into `entities` with metrics subset (for now, just name/email/notes; later extend to full metrics if needed).
    - `useUpdateClient`: update entity row, respecting soft-delete fields if present.
    - `useDeleteClient`: either soft delete (set `deleted_at`) or hard delete, mirroring `deleteEntityAction`.
- On **UI**:
  - Keep `AddClientModal` as the quick-add entrypoint from the dashboard, but ensure errors and loading states come from the new hooks.
  - Add dedicated client screens:
    - `app/(app)/clients/index.tsx`: list of all clients using `useClients`, with search/filter and navigation to detail.
    - `app/(app)/clients/[id].tsx`: client detail with email, notes, associated program count, and actions to edit or delete.
  - Use React Native Paper where reasonable inside these screens (e.g., `Card`, `TextInput`, `Button`), gradually reducing reliance on `className` styles.

### 5. Programs List and Simple Creation
- Adapt **program hooks** on mobile:
  - Update `usePrograms`/`useProgram` to query Supabase `programs` directly for the current user’s entities (using the same filter pattern as `useDashboardData`: `entity_id` in the user’s `entities` IDs and `deleted_at IS NULL` if applicable).
  - Compute derived fields like `client_name` and `workout_count` via joins or separate queries, matching what the dashboard’s `ProgramsList` effectively shows.
- Wire these hooks into existing screens:
  - `ProgramsScreen` should show a count and list using `ProgramCard` fed by the new Supabase-backed `usePrograms` hook.
  - Pull-to-refresh should call `refetch` from `usePrograms`.
- Adjust `CreateProgramScreen`:
  - Decide whether simple creation should:
    - (a) Insert directly into Supabase `programs`, or
    - (b) call `/api/CreateProgram` with a trimmed body (name, entity_id, basic calendar defaults) to reuse server-side validation and duplicate detection.
  - Given the web now relies on `/api/CreateProgram`, prefer (b) to keep program creation logic centralized:
    - On mobile, collect minimal fields (name, optional description, duration_weeks, target client/entity_id, simple start date and days_of_week) and POST that JSON via `ApiClient` to `/api/CreateProgram`.
    - After success, navigate to the new program’s detail/builder screen (`/(app)/programs/[id]`).
  - Update `ProgramInput` Zod schema and `CreateProgramScreen` form to capture `entity_id` (client selection from `useClients`) and simple scheduling info so the server can fill `calendar_data`, `gym_details`, and `session_details` with reasonable defaults.

### 6. Program Detail and Workout List (View Programs)
- Replace the placeholder `ProgramDetailScreen` with a real detail screen backed by Supabase hooks and/or a helper API:
  - Use `useProgramDataMobile(programId)` to fetch the program row and convert it to a view model (name, description, duration, entity/client, goal, difficulty, calendar data, gym_details, etc.).
  - Use `useProgramWorkoutsMobile(programId)` to fetch `program_workouts` (both scheduled and reference workouts), grouped by week or date.
- UI for the detail screen:
  - Header with program name, client name/type (from `entities`), duration, and high-level goal/difficulty if available.
  - Tabs or sections for "Overview", "Workouts", and optionally "Calendar" (phase 2).
  - Workouts list: show title, date, high-level tags (if present), completion status, and navigation to a future per-workout screen if needed.
  - Add actions: "Generate/Regenerate Program" and "Enhance Program" (see next section) as primary buttons.

### 7. Program Builder and AI Generation
- Design a **mobile program builder screen** attached to each program, reusing backend logic but with mobile-appropriate UX:
  - Screen route: e.g., `app/(app)/programs/[id]/builder.tsx` or embed builder in the program detail "Overview" tab.
  - Fields based on `useProgramData.getFormData()` and `MIGRATION_GUIDE` mapping:
    - goal, difficulty, focusArea, trainingMethodology, gymType, equipment, workoutFormats, numberOfWeeks, daysPerWeek/daysOfWeek, startDate, personalization, referenceInput.
- Implement a **mobile version** of the generation flow that mirrors `programActions.generateProgram` but in React Native:
  - Build the request body using the same structure AIProgramWriter expects (including nested `calendar_data`, `gym_details`, `workout_format`, `session_details`, `forceRegenerate` when regenerating).
  - Use `ApiClient` (or a dedicated fetch wrapper) to POST to `/api/generate-program-anthropic` with `Accept: text/event-stream` for multi-week programs.
  - Implement SSE client logic in React Native by reading `response.body` as a `ReadableStream`, decoding chunks, splitting on `\n\n`, and parsing `data: {"type": ...}` messages, handling at least:
    - `status`, `ai_request`, `ai_content_stream`, `program_metadata`, `workout_chunk`, `warning`, `error`, `complete`.
  - As workouts stream in (`workout_chunk`), update a local `streamingWorkouts` list for real-time UI feedback.
  - Once generation completes, rely on server-side logic (already in `/api/generate-program-anthropic`) to insert workouts into `program_workouts` and update `programs.generated_program` and `program_overview`, then trigger a `refetch` of `useProgramWorkoutsMobile` and `useProgramDataMobile` to show final persisted data.
- Respect business rules enforced in middleware and API routes (subscription/trial limits, generation counts); surface their error messages in the mobile UI when the SSE stream reports an `error`.

### 8. Workout Viewing and Enhancement
- On the program detail screen or a dedicated workouts screen:
  - Use `useProgramWorkoutsMobile` to show all workouts, sorted by `scheduled_date` with clear indication of today/upcoming.
  - Allow toggling completion and rescheduling dates by calling `updateWorkout`/`updateWorkoutDate` style functions wired to Supabase.
- Implement **workout enhancement** on mobile:
  - Add a per-workout action (e.g., "Enhance" button) that opens a modal where the coach enters instructions, methodology, equipment, and injuries (re-using fields from the builder where possible).
  - POST to `/api/enhance-workout` with the same payload shape the web uses: `{ workout: { title, description/body, ... }, instructions, methodology, gymEquipment, injuries }` via `ApiClient`.
  - Replace the workout body in Supabase with the enhanced version returned from the API, and refresh the local workouts list.
- (Optional later) Implement **program-level enhancement** by posting a subset of workouts and context to `/api/enhance-program` and applying returned changes en masse, mirroring the web behavior.

### 9. UI/Theming and Tech Debt
- Standardize on **React Native Paper** for form controls on new/updated screens (auth, clients, program creation, program builder) to avoid further nativewind issues.
- Gradually refactor existing `className`-based components (`Button`, `Card`, etc.) either to:
  - Use StyleSheet styles only, or
  - Wrap React Native Paper components with a thin layer that preserves the existing API but does not depend on nativewind.
- Keep layout simple and performance-friendly (avoid deeply nested views or heavy animations until core flows are stable).

### 10. Testing, Observability, and Rollout
- Add basic unit/integration tests for:
  - `AuthProvider` and `useAuth` (sign-in/sign-up/sign-out flows with mocked Supabase).
  - Data hooks (`useDashboardDataMobile`, `useProgramDataMobile`, `useProgramWorkoutsMobile`) using mocked Supabase client.
  - Program builder SSE parsing logic to ensure it handles partial chunks, multiple events, and error cases.
- Manual QA scenarios:
  - New user sign-up (web and mobile) and first-time program creation.
  - Existing user migrating from web-only to mobile: sign-in, see existing programs/clients, generate a new program, enhance a workout.
- Plan staged rollout:
  - Internal testing with development Supabase project.
  - Point `EXPO_PUBLIC_API_URL` to production `https://halteres.ai` once flows are verified.
  - Monitor Supabase logs and Vercel logs for `/api/*` endpoints to catch mobile-specific issues (e.g., malformed request bodies, auth header problems).
