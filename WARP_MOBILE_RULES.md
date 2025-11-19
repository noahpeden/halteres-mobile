# Halteres Mobile Development Rules

## Core Principle: Mirror the Web App

**CRITICAL**: When implementing features in the mobile app, always check and follow the UI patterns and business logic from the existing `halteres.ai` Next.js web app.

### Why This Matters
- The web app (`halteres.ai`) is the production reference implementation with proven UX and business rules
- Database schema, RLS policies, and API contracts are designed around web app behavior
- Users expect consistent behavior between web and mobile platforms
- Deviating creates bugs, confusion, and technical debt

### Implementation Guidelines

1. **Before implementing ANY feature:**
   - Search the web app codebase for similar functionality
   - Read the relevant components, hooks, and API routes
   - Document the exact flow, validation rules, and data requirements
   - Match those patterns in the mobile implementation

2. **UI/UX Patterns:**
   - If the web app requires user input (e.g., selecting a client before creating a program), mobile must too
   - If the web app has a multi-step wizard, consider how to adapt it for mobile (not necessarily 1:1, but preserve key steps)
   - Match validation rules, error messages, and success flows
   - Use React Native Paper components to create mobile-appropriate versions of web UI

3. **Business Logic:**
   - Copy required field validations exactly (e.g., `entity_id` is required for programs)
   - Respect the same database schema and constraints
   - Use the same API endpoints when they exist
   - Don't invent shortcuts or "smart defaults" that bypass web app rules

4. **Data Flow:**
   - Programs MUST be linked to entities (clients/classes) - never create orphaned programs
   - Follow the web app's entity → program → workout hierarchy
   - Use the same Supabase RLS policies (don't try to work around them)
   - Match field names and data structures exactly

5. **API Integration:**
   - Prefer existing `/api/*` endpoints over direct Supabase inserts when the web uses them
   - Use direct Supabase queries only when the web app does
   - Send request bodies that match web app format exactly
   - Handle the same success/error responses

### Example: Program Creation

**Web App Pattern (from `useDashboardModals.js`):**
```javascript
// Required fields checked before API call
if (!programName.trim() || daysOfWeek.length === 0 || !selectedEntityId) return;

// Always requires entity_id
const response = await fetch('/api/CreateProgram', {
  method: 'POST',
  body: JSON.stringify({
    name: programName,
    entity_id: selectedEntityId,  // REQUIRED
    duration_weeks: programDuration,
    // ... other fields
  })
});
```

**Mobile App Must:**
- ✅ Require client selection before program creation
- ✅ Validate that entity_id is present
- ✅ Use the same `/api/CreateProgram` endpoint
- ✅ Send the same request structure
- ❌ NOT auto-create entities without user action
- ❌ NOT allow programs without entity_id

### When to Deviate

Only deviate from web app patterns when:
1. **Mobile-specific constraints** require it (e.g., different navigation patterns for tabs vs sidebar)
2. **Performance optimization** for mobile networks (e.g., reducing API roundtrips)
3. **User explicitly requests** a different mobile experience
4. **You document the deviation** and get approval

### Reference Locations

**Web App (`halteres.ai`):**
- Auth: `app/contexts/AuthContext.jsx`
- Dashboard: `app/dashboard/page.js`, `app/hooks/useDashboardData.js`, `app/hooks/useDashboardModals.js`
- Clients: `app/dashboard/manage/entities/`, `app/actions/entityActions.js`
- Programs: `app/hooks/useProgramData.js`, `app/hooks/useProgramWorkouts.js`
- API Routes: `app/api/CreateProgram/`, `app/api/generate-program-anthropic/`, etc.
- Program Builder: `app/program/[programId]/writer/`, `app/components/AIProgramWriter/`

**Mobile App (`halteres-mobile`):**
- Should mirror web patterns using React Native Paper, Expo Router, and direct Supabase where appropriate
